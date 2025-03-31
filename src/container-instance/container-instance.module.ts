import { Module } from '@nestjs/common';
import { ContainerInstanceService } from './container-instance.service';

@Module({
  providers: [ContainerInstanceService]
})
export class ContainerInstanceModule {}
