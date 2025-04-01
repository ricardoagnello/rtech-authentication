import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContainerResponseDto } from './dto/container-response.dto';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto } from './dto/update-container.dto';
import { plainToInstance } from 'class-transformer';
import { DockerService } from 'src/docker/docker.service';

@Injectable()
export class ContainerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dockerService: DockerService,
  ) {}

  async createContainer(data: CreateContainerDto, userId: string, planId: string): Promise<ContainerResponseDto> {
    // Verificando se o usuário e o plano existem
    const user = await this.prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
    }

    const plan = await this.prisma.plan.findUnique({
        where: { id: planId },
    });

    if (!plan) {
        throw new NotFoundException('Plano não encontrado.');
    }

    // Contando apps e bancos de dados do usuário
    const appCount = await this.prisma.containerInstance.count({
        where: { userId, type: 'app' },
    });

    const dbCount = await this.prisma.containerInstance.count({
        where: { userId, type: 'db' },
    });

    if (appCount >= plan.maxApps) {
        throw new BadRequestException('Limite de aplicativos atingido para o seu plano.');
    }

    if (dbCount >= plan.maxDatabases) {
        throw new BadRequestException('Limite de bancos de dados atingido para o seu plano.');
    }

    /// Cria o container no banco de dados
    const container = await this.prisma.containerInstance.create({
      data: {
        name: data.name,
        image: data.image,
        status: 'created',
        type: data.type, // Tipo de container: 'app' ou 'db'
        user: {
          connect: {
            id: userId,
          },
        },
        plan: {
          connect: {
            id: planId,
          },
        },
      },
    });

    // Cria o container no Docker
    const cmd = data.type === 'app' ? ['npm', 'start'] : ['some-db-start-command']; // Exemplo de comando
    const ports = ['3000']; // Definir os ports dependendo do tipo de container
    const dockerContainer = await this.dockerService.createContainer(container.name, container.image, cmd, ports);

    // Inicia o container criado
    await this.dockerService.startContainer(dockerContainer);

    return plainToInstance(ContainerResponseDto, container, { excludeExtraneousValues: true });
  }

  // Método para parar o container
  async stopContainer(containerId: string): Promise<void> {
    const container = await this.prisma.containerInstance.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundException('Container não encontrado');
    }

    // Obter o objeto de container do Docker usando o ID do container
    const dockerContainer = await this.dockerService.getContainerById(containerId);

    // Parando o container no Docker
    await this.dockerService.stopContainer(dockerContainer);

    // Atualiza o status do container para "stopped" no banco de dados
    await this.prisma.containerInstance.update({
      where: { id: containerId },
      data: { status: 'stopped' },
    });
  }

  async deleteContainer(containerId: string, userId: string): Promise<{ message: string }> {
    // 1️⃣ Verifica se o container existe no banco de dados
    const container = await this.prisma.containerInstance.findUnique({
      where: { id: containerId },
    });
  
    if (!container || container.userId !== userId) {
      throw new NotFoundException('Container não encontrado ou acesso negado.');
    }
  
    // 2️⃣ Chama o DockerService para parar e remover o container do Docker
    try {
      await this.dockerService.stopContainer(container.name);
      await this.dockerService.removeContainer(container.name);
    } catch (error) {
      throw new BadRequestException(`Erro ao remover container no Docker: ${error.message}`);
    }
  
    // 3️⃣ Remove o container do banco de dados
    await this.prisma.containerInstance.delete({
      where: { id: containerId },
    });
  
    // 4️⃣ Retorna resposta de sucesso
    return { message: 'Container removido com sucesso' };
  }

  async getContainerById(containerId: string): Promise<any> {
    try {
      const container = await this.prisma.containerInstance.findUnique({
        where: { id: containerId },
      });
  
      if (!container) {
        throw new NotFoundException('Container não encontrado');
      }
  
      return container;
    } catch (error) {
      throw new BadRequestException('Erro ao buscar container');
    }
  }

  // Método para remover um container
  async removeContainer(containerId: string): Promise<void> {
    // Verifica se o container existe no banco de dados
    const container = await this.prisma.containerInstance.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundException('Container não encontrado.');
    }

    // Remove o container do Docker
    try {
      await this.dockerService.removeContainer(containerId); // Chama o método do DockerService
    } catch (error) {
      throw new BadRequestException('Erro ao remover o container no Docker.');
    }

    // Remove o container do banco de dados
    await this.prisma.containerInstance.delete({
      where: { id: containerId },
    });
  }
}
  
  
