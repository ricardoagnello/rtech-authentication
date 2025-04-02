import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DockerService } from 'src/docker/docker.service';
import { RepositoryService } from 'src/repository/repository.service';
import { StackDetectorService } from 'src/stack-detector/stack-detector.service';
import { DockerfileService } from 'src/docker-file/docker-file.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LogsGateway } from 'src/logs/logs.gateway';

@Injectable()
export class DeployService {
  private readonly logger = new Logger(DeployService.name);

  constructor(
    private readonly dockerService: DockerService,
    private readonly repositoryService: RepositoryService,
    private readonly stackDetectorService: StackDetectorService,
    private readonly dockerfileService: DockerfileService,
    private readonly prisma: PrismaService,
    private readonly logsGateway: LogsGateway, // Adicionando LogsGateway
  ) {}

  async deployApp(userId: string, repoUrl: string, envVars: Record<string, string>) {
    try {
      this.logsGateway.sendLog(userId, 'Iniciando deploy da aplicação...');
      
      const repoPath = await this.repositoryService.cloneRepository(repoUrl);
      this.logsGateway.sendLog(userId, 'Repositório clonado com sucesso.');
      
      const stack = await this.stackDetectorService.detectStackFromRepository(repoPath);
      this.logsGateway.sendLog(userId, `Stack detectada: ${stack}.`);
      
      await this.dockerfileService.generateDockerfileForStack(repoPath);
      this.logsGateway.sendLog(userId, 'Dockerfile gerado com sucesso.');
      
      const imageName = `${userId}-app`;
      await this.dockerService.buildImage(repoPath, imageName);
      this.logsGateway.sendLog(userId, `Imagem Docker ${imageName} construída com sucesso.`);
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { plan: true },
      });
      
      if (!user || !user.plan) {
        throw new BadRequestException('Usuário ou plano não encontrado.');
      }
      
      const serviceName = `${userId}-service`;
      const volumeNameApp = `app-volume-${userId}`;
      const volumeNameDb = `db-volume-${userId}`;
      
      await this.dockerService.ensureVolumeExists(volumeNameApp);
      await this.dockerService.ensureVolumeExists(volumeNameDb);
      this.logsGateway.sendLog(userId, 'Volumes criados com sucesso.');
      
      const stackConfig: Record<string, { command: string[]; port: string }> = {
        node: { command: ['npm', 'start'], port: '3000' },
        python: { command: ['python', 'app.py'], port: '5000' },
        ruby: { command: ['ruby', 'app.rb'], port: '4567' },
        go: { command: ['./app'], port: '8080' },
        dotnet: { command: ['dotnet', 'out/app.dll'], port: '80' },
        springboot: { command: ['java', '-jar', 'app.jar'], port: '8080' },
        php: { command: ['apache2-foreground'], port: '80' },
      };
      
      if (!stackConfig[stack]) {
        throw new BadRequestException(`Stack "${stack}" não suportada.`);
      }
      
      const { command, port } = stackConfig[stack];
      
      await this.dockerService.createSwarmService(
        serviceName,
        imageName,
        command,
        [`${port}:80`],
        user.plan.name.toLowerCase(),
        volumeNameApp,
        volumeNameDb
      );
      
      await this.prisma.deployment.create({
        data: {
          userId,
          serviceName,
          imageName,
          repoUrl,
          stack,
          envVars: JSON.stringify(envVars),
          status: 'running',
        },
      });
      
      this.logsGateway.sendLog(userId, 'Deploy concluído com sucesso!');
      return { message: `Deploy realizado com sucesso! Serviço disponível na porta ${port}.` };
    } catch (error) {
      this.logger.error('Erro no deploy:', error);
      this.logsGateway.sendLog(userId, `Erro no deploy: ${error.message}`);
      throw new BadRequestException('Erro ao realizar o deploy.');
    }
  }

  async restartApp(userId: string) {
    const deployment = await this.prisma.deployment.findFirst({ where: { userId } });
    if (!deployment) {
      throw new BadRequestException('Aplicação não encontrada.');
    }
    
    this.logsGateway.sendLog(userId, 'Reiniciando aplicação...');
    await this.dockerService.restartContainer(deployment.serviceName);
    this.logsGateway.sendLog(userId, 'Aplicação reiniciada com sucesso!');
    return { message: 'Aplicação reiniciada com sucesso!' };
  }

  async deleteApp(userId: string) {
    const deployment = await this.prisma.deployment.findFirst({ where: { userId } });
    if (!deployment) {
      throw new BadRequestException('Aplicação não encontrada.');
    }
    
    this.logsGateway.sendLog(userId, 'Removendo aplicação...');
    await this.dockerService.removeSwarmService(deployment.serviceName);
    await this.prisma.deployment.deleteMany({ where: { userId } });
    this.logsGateway.sendLog(userId, 'Aplicação removida com sucesso!');
    return { message: 'Aplicação removida com sucesso!' };
  }

  async stopApp(userId: string) {
    const deployment = await this.prisma.deployment.findFirst({ where: { userId } });
    if (!deployment) {
      throw new BadRequestException('Aplicação não encontrada.');
    }
    
    this.logsGateway.sendLog(userId, 'Parando aplicação...');
    await this.dockerService.stopContainer(deployment.serviceName);
    this.logsGateway.sendLog(userId, 'Aplicação parada com sucesso!');
    return { message: 'Aplicação parada com sucesso!' };
  }
}
