import { Module } from '@nestjs/common';
import { DeployService } from './deploy.service';
import { DeployController } from './deploy.controller';
import { DockerService } from 'src/docker/docker.service';
import { RepositoryService } from 'src/repository/repository.service';
import { StackDetectorService } from 'src/stack-detector/stack-detector.service';
import { DockerfileService } from 'src/docker-file/docker-file.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [DeployService, DockerService, RepositoryService, StackDetectorService, DockerfileService, PrismaService],
  controllers: [DeployController],
  exports: [DeployService]
})
export class DeployModule {}
