import { Module } from '@nestjs/common';
import { StackDetectorService } from './stack-detector.service';
import { RepositoryService } from 'src/repository/repository.service';

@Module({
  providers: [StackDetectorService, RepositoryService],
  exports: [StackDetectorService],
})
export class StackDetectorModule {}
