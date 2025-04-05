import { Controller, Get, Param } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('container/:containerId')
  async getMetricsForContainer(@Param('containerId') containerId: string) {
    return this.metricsService.getMetricsForContainer(containerId);
  }
}

