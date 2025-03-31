import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContainerResponseDto } from './dto/container-response.dto';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto } from './dto/update-container.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ContainerService {
  constructor(private readonly prisma: PrismaService) {}

  async createContainer(data: CreateContainerDto, userId: string, planId: string): Promise<ContainerResponseDto> {
    const container = await this.prisma.containerInstance.create({
      data: {
        name: data.name,
        image: data.image,
        status: 'created',
        user: {
          connect: {
            id: userId, // Vinculando o container ao usuário
          },
        },
        plan: {
          connect: {
            id: planId, // Vinculando o container ao plano
          },
        },
      },
    });

    return plainToInstance(ContainerResponseDto, container, { excludeExtraneousValues: true });
  }

  async getContainerById(id: string): Promise<ContainerResponseDto> {
    const container = await this.prisma.containerInstance.findUnique({
      where: { id },
    });

    if (!container) {
      throw new NotFoundException('Container não encontrado');
    }

    return plainToInstance(ContainerResponseDto, container, { excludeExtraneousValues: true });
  }

  async listContainers(): Promise<ContainerResponseDto[]> {
    const containers = await this.prisma.containerInstance.findMany();
    return containers.map(container =>
      plainToInstance(ContainerResponseDto, container, { excludeExtraneousValues: true }),
    );
  }

  async updateContainer(id: string, data: UpdateContainerDto): Promise<ContainerResponseDto> {
    const container = await this.prisma.containerInstance.update({
      where: { id },
      data,
    });

    return plainToInstance(ContainerResponseDto, container, { excludeExtraneousValues: true });
  }

  async deleteContainer(id: string): Promise<void> {
    await this.prisma.containerInstance.delete({
      where: { id },
    });
  }
}
