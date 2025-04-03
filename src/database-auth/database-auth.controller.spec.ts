import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseAuthController } from './database-auth.controller';
import { DatabaseAuthService } from './database-auth.service';

describe('DatabaseAuthController', () => {
  let controller: DatabaseAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatabaseAuthController],
      providers: [DatabaseAuthService],
    }).compile();

    controller = module.get<DatabaseAuthController>(DatabaseAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
