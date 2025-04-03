import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseAuthService } from './database-auth.service';

describe('DatabaseAuthService', () => {
  let service: DatabaseAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseAuthService],
    }).compile();

    service = module.get<DatabaseAuthService>(DatabaseAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
