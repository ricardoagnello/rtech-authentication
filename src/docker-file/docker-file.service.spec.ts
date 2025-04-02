import { Test, TestingModule } from '@nestjs/testing';
import { DockerFileService } from './docker-file.service';

describe('DockerFileService', () => {
  let service: DockerFileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DockerFileService],
    }).compile();

    service = module.get<DockerFileService>(DockerFileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
