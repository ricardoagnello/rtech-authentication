import { Module } from '@nestjs/common';
import { DockerfileService } from './docker-file.service';
import { RepositoryService } from 'src/repository/repository.service';
import { StackDetectorService } from 'src/stack-detector/stack-detector.service';

@Module({
  providers: [DockerfileService, RepositoryService, StackDetectorService],
  exports: [DockerfileService],
})
export class DockerFileModule {}
