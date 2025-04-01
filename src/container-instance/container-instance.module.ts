import { Module } from '@nestjs/common';
import { ContainerInstanceService } from './container-instance.service';
import { ContainerInstanceController } from './container-instance.controller';

@Module({
  providers: [ContainerInstanceService],
  controllers: [ContainerInstanceController]
})
export class ContainerInstanceModule {}
