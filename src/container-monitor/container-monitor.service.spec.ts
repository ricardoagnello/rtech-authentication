import { Test, TestingModule } from '@nestjs/testing';
import { ContainerMonitorService } from './container-monitor.service';

describe('ContainerMonitorService', () => {
  let service: ContainerMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContainerMonitorService],
    }).compile();

    service = module.get<ContainerMonitorService>(ContainerMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
