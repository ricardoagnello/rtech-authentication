import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DockerService } from 'src/docker/docker.service';
import { RepositoryService } from 'src/repository/repository.service';
import { StackDetectorService } from 'src/stack-detector/stack-detector.service';
import { DockerfileService } from 'src/docker-file/docker-file.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DeployService {
  private readonly logger = new Logger(DeployService.name);

  constructor(
    private readonly dockerService: DockerService,
    private readonly repositoryService: RepositoryService,
    private readonly stackDetectorService: StackDetectorService,
    private readonly dockerfileService: DockerfileService,
    private readonly prisma: PrismaService,
  ) {}

  async deployApp(userId: string, repoUrl: string, envVars: Record<string, string>) {
    try {
      const repoPath = await this.repositoryService.cloneRepository(repoUrl);
      const stack = await this.stackDetectorService.detectStackFromRepository(repoPath);
      await this.dockerfileService.generateDockerfileForStack(repoPath);
      
      const imageName = `${userId}-app`;
      await this.dockerService.buildImage(repoPath, imageName);
      
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
      
      return { message: `Deploy realizado com sucesso! Serviço disponível na porta ${port}.` };
    } catch (error) {
      this.logger.error('Erro no deploy:', error);
      throw new BadRequestException('Erro ao realizar o deploy.');
    }
  }

  async restartApp(userId: string) {
    const deployment = await this.prisma.deployment.findFirst({ where: { userId } });
    if (!deployment) {
      throw new BadRequestException('Aplicação não encontrada.');
    }

    await this.dockerService.restartContainer(deployment.serviceName);
    return { message: 'Aplicação reiniciada com sucesso!' };
  }

  async deleteApp(userId: string) {
    const deployment = await this.prisma.deployment.findFirst({ where: { userId } });
    if (!deployment) {
      throw new BadRequestException('Aplicação não encontrada.');
    }

    await this.dockerService.removeSwarmService(deployment.serviceName);
    await this.prisma.deployment.deleteMany({ where: { userId } });
    return { message: 'Aplicação removida com sucesso!' };
  }

  async stopApp(userId: string) {
    const deployment = await this.prisma.deployment.findFirst({ where: { userId } });
    if (!deployment) {
      throw new BadRequestException('Aplicação não encontrada.');
    }
  
    await this.dockerService.stopContainer(deployment.serviceName);
    return { message: 'Aplicação parada com sucesso!' };
  }
  
}
