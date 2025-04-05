import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetricsForContainer(containerId: string) {
    return this.prisma.containerMetrics.findMany({
      where: { containerId },
      orderBy: { createdAt: 'desc' },
      take: 20, // últimas 20 métricas
    });
  }
}

