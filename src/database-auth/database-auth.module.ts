import { Module } from '@nestjs/common';
import { DatabaseAuthService } from './database-auth.service';
import { DatabaseAuthController } from './database-auth.controller';

@Module({
  controllers: [DatabaseAuthController],
  providers: [DatabaseAuthService],
})
export class DatabaseAuthModule {}
