import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  // Criação de plano
  async create(createPlanDto: CreatePlanDto) {
    return this.prisma.plan.create({
      data: {
        ...createPlanDto,
        databases: { create: Array(createPlanDto.databases).fill({}) }, // Adjust mapping as needed
      },
    });
  }

  // Listar todos os planos
  async findAll() {
    return this.prisma.plan.findMany();
  }

  // Buscar um plano pelo ID
  async findOne(id: string) {
    return this.prisma.plan.findUnique({ where: { id } });
  }

  // Atualizar plano
  async update(id: string, updatePlanDto: UpdatePlanDto) {
    const { databases, ...rest } = updatePlanDto;
    return this.prisma.plan.update({
      where: { id },
      data: {
        ...rest,
        databases: databases
          ? { create: Array(databases).fill({}) } // Adjust mapping as needed
          : undefined,
      },
    });
  }

  // Remover plano
  async remove(id: string) {
    return this.prisma.plan.delete({ where: { id } });
  }
}
