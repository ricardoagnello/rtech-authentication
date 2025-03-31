import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  // Criação de plano
  async create(createPlanDto: CreatePlanDto) {
    return this.prisma.plan.create({ data: createPlanDto });
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
    return this.prisma.plan.update({ where: { id }, data: updatePlanDto });
  }

  // Remover plano
  async remove(id: string) {
    return this.prisma.plan.delete({ where: { id } });
  }
}
