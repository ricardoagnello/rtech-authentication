import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ContainerService } from './container-instance.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { ContainerResponseDto } from './dto/container-response.dto';
import { ApiKeyGuard } from 'src/auth/guards/api-key.guard';

@Controller('containers')
@UseGuards(ApiKeyGuard)
export class ContainerInstanceController {
  constructor(private readonly containerService: ContainerService) {}

  @Post()
  async createContainer(
    @Body() createContainerDto: CreateContainerDto,
    @Query('userId') userId: string,
    @Query('planId') planId: string,
  ): Promise<ContainerResponseDto> {
    return this.containerService.createContainer(createContainerDto, userId, planId);
  }

  @Put(':id/stop')
  async stopContainer(@Param('id') containerId: string): Promise<void> {
    return this.containerService.stopContainer(containerId);
  }

  @Delete(':id')
  async deleteContainer(@Param('id') containerId: string, @Query('userId') userId: string): Promise<{message: string}> {
    return this.containerService.deleteContainer(containerId, userId);
  }

  @Get(':id')
  async getContainerById(@Param('id') containerId: string): Promise<ContainerResponseDto> {
    return this.containerService.getContainerById(containerId);
  }

  @Put(':id/scale')
  async scaleContainer(@Param('id') containerId: string, @Body('replicas') replicas: number): Promise<void> {
    return this.containerService.scaleContainer(containerId, replicas);
  }

  @Get(':containerId/metrics')
  async getMetrics(@Req() req, @Param('containerId') containerId: string) {
  return this.containerService.getContainerMetrics(req.user.id, containerId);
}

}

