import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { ContainerService } from './container-instance.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { ContainerResponseDto } from './dto/container-response.dto';

@Controller('containers')
export class ContainerController {
  constructor(private readonly containerService: ContainerService) {}

  @Post()
  async createContainer(
    @Body() createContainerDto: CreateContainerDto
  ): Promise<ContainerResponseDto> {
    const { userId, planId } = createContainerDto; // Pegamos os IDs do DTO
    return this.containerService.createContainer(createContainerDto, userId, planId);
  }

  @Get(':id')
  async getContainer(@Param('id') containerId: string): Promise<ContainerResponseDto> {
    return this.containerService.getContainerById(containerId);
  }

  @Post(':id/stop')
  async stopContainer(@Param('id') containerId: string): Promise<void> {
    return this.containerService.stopContainer(containerId);
  }

  @Delete(':id')
  async removeContainer(@Param('id') containerId: string): Promise<void> {
    return this.containerService.removeContainer(containerId);
  }
}

