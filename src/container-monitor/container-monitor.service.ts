import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DockerService } from '../docker/docker.service';

@Injectable()
export class ContainerMonitorService {
  private readonly logger = new Logger(ContainerMonitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dockerService: DockerService,
  ) {}

  @Cron('*/5 * * * *') // Executa a cada 5 minutos
  async checkAndRestartContainers() {
    this.logger.log('Verificando containers parados...');

    const stoppedContainers = await this.prisma.containerInstance.findMany({
      where: { status: 'stopped' },
    });

    for (const container of stoppedContainers) {
      try {
        this.logger.log(`Tentando reiniciar container: ${container.name}`);
        await this.dockerService.restartContainer(container.name);

        await this.prisma.containerInstance.update({
          where: { id: container.id },
          data: { status: 'running' },
        });

        this.logger.log(`Container ${container.name} reiniciado com sucesso.`);
      } catch (error) {
        this.logger.error(`Erro ao reiniciar container ${container.name}:`, error);
      }
    }
  }
}

