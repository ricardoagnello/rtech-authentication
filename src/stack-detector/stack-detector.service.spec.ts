import { Test, TestingModule } from '@nestjs/testing';
import { StackDetectorService } from './stack-detector.service';

describe('StackDetectorService', () => {
  let service: StackDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StackDetectorService],
    }).compile();

    service = module.get<StackDetectorService>(StackDetectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
