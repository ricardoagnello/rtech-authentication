import { Controller, Post, Body } from '@nestjs/common';
import { DatabaseAuthService } from './database-auth.service';

@Controller('database-auth')
export class DatabaseAuthController {
  constructor(private readonly databaseAuthService: DatabaseAuthService) {}

  @Post('create-temp-user')
  async createTempUser(@Body('dbType') dbType: 'postgres' | 'mysql' | 'mongo') {
    return this.databaseAuthService.createTempUser(dbType);
  }

  @Post('delete-temp-user')
  async deleteTempUser(@Body() { dbType, username }: { dbType: 'postgres' | 'mysql' | 'mongo'; username: string }) {
    return this.databaseAuthService.deleteTempUser(dbType, username);
  }
}

