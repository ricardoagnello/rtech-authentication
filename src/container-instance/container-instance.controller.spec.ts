import { Test, TestingModule } from '@nestjs/testing';
import { ContainerInstanceController } from './container-instance.controller';

describe('ContainerInstanceController', () => {
  let controller: ContainerInstanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContainerInstanceController],
    }).compile();

    controller = module.get<ContainerInstanceController>(ContainerInstanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
