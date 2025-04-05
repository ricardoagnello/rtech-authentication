import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DockerService } from 'src/docker/docker.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { ContainerResponseDto } from './dto/container-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ContainerService {
  private readonly logger = new Logger(ContainerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dockerService: DockerService,
  ) {}

  async createContainer(
    data: CreateContainerDto, 
    userId: string, 
    planId: string
  ): Promise<ContainerResponseDto> {
    // Verifica se o usuário e o plano existem
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
  
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plano não encontrado.');
  
    // Verifica se o usuário já atingiu os limites do plano
    const appCount = await this.prisma.containerInstance.count({ where: { userId, type: 'app' } });
    const dbCount = await this.prisma.containerInstance.count({ where: { userId, type: 'db' } });
  
    if (data.type === 'app' && appCount >= plan.maxApps) {
      throw new BadRequestException('Limite de aplicativos atingido para o seu plano.');
    }
  
    if (data.type === 'db' && dbCount >= plan.maxDatabases) {
      throw new BadRequestException('Limite de bancos de dados atingido para o seu plano.');
    }
  
    // Cria o container no banco de dados
    const container = await this.prisma.containerInstance.create({
      data: {
        name: data.name,
        image: data.image,
        status: 'created',
        type: data.type, // Tipo de container: 'app' ou 'db'
        user: { connect: { id: userId } },
        plan: { connect: { id: planId } },
      },
    });
  
    // Define nomes dos volumes
    const volumeNameApp = `app-volume-${container.id}`;
    const volumeNameDb = `db-volume-${container.id}`;
  
    // Garante que os volumes existam antes de criar o serviço no Docker Swarm
    await this.dockerService.ensureVolumeExists(volumeNameApp);
    await this.dockerService.ensureVolumeExists(volumeNameDb);
  
    // Define comandos e portas dependendo do tipo de container
    const cmd = data.type === 'app' ? ['npm', 'start'] : ['some-db-start-command'];
    const ports = data.type === 'app' ? ['3000'] : ['5432']; // Exemplo para PostgreSQL
  
    try {
      const service = await this.dockerService.createSwarmService(
        container.name, 
        container.image, 
        cmd, 
        ports, 
        plan.name.toLowerCase(), // Nome do plano como string
        volumeNameApp, 
        volumeNameDb
      );
  
      // Atualiza o status do container para "running" no banco de dados
      await this.prisma.containerInstance.update({
        where: { id: container.id },
        data: { status: 'running' },
      });
  
      return plainToInstance(ContainerResponseDto, container, { excludeExtraneousValues: true });
    } catch (error) {
      this.logger.error('Erro ao criar o serviço no Swarm:', error);
      throw new BadRequestException('Erro ao criar o serviço no Docker Swarm');
    }
  }
  

  async stopContainer(containerId: string): Promise<void> {
    const container = await this.prisma.containerInstance.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundException('Container não encontrado.');
    }

    try {
      // Remover o serviço no Docker Swarm
      await this.dockerService.removeSwarmService(container.name);

      // Atualiza o status do container para "stopped" no banco de dados
      await this.prisma.containerInstance.update({
        where: { id: containerId },
        data: { status: 'stopped' },
      });
    } catch (error) {
      this.logger.error('Erro ao parar o serviço no Swarm: ', error);
      throw new BadRequestException('Erro ao parar o serviço no Docker Swarm');
    }
  }

  async deleteContainer(containerId: string, userId: string): Promise<{ message: string }> {
    const container = await this.prisma.containerInstance.findUnique({
      where: { id: containerId },
    });

    if (!container || container.userId !== userId) {
      throw new NotFoundException('Container não encontrado ou acesso negado.');
    }

    try {
      // Remove o serviço do Docker Swarm
      await this.dockerService.removeSwarmService(container.name);

      // Remove o container do banco de dados
      await this.prisma.containerInstance.delete({
        where: { id: containerId },
      });

      return { message: 'Container removido com sucesso.' };
    } catch (error) {
      this.logger.error('Erro ao remover o serviço do Swarm: ', error);
      throw new BadRequestException('Erro ao remover o serviço no Docker Swarm');
    }
  }

  async getContainerById(containerId: string): Promise<any> {
    const container = await this.prisma.containerInstance.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundException('Container não encontrado.');
    }

    return container;
  }

  async scaleContainer(containerId: string, replicas: number): Promise<void> {
    const container = await this.prisma.containerInstance.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundException('Container não encontrado.');
    }

    try {
      await this.dockerService.scaleService(container.name, replicas);
    } catch (error) {
      this.logger.error('Erro ao escalar o serviço no Swarm: ', error);
      throw new BadRequestException('Erro ao escalar o serviço no Docker Swarm');
    }
  }

  async getContainerMetrics(userId: string, containerId: string) {
    const container = await this.prisma.containerInstance.findFirst({
      where: { id: containerId, userId },
      include: { metrics: true },
    });
  
    if (!container) {
      throw new NotFoundException('Container não encontrado.');
    }
  
    return container.metrics;
  }
  
}
