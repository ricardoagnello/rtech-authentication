import { Test, TestingModule } from '@nestjs/testing';
import { ContainerInstanceService } from './container-instance.service';

describe('ContainerInstanceService', () => {
  let service: ContainerInstanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContainerInstanceService],
    }).compile();

    service = module.get<ContainerInstanceService>(ContainerInstanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
