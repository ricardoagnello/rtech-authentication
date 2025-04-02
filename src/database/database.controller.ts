import { Controller, Post, Body, Get, Param, Delete, BadRequestException } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('databases')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  // Endpoint para criar o banco de dados
  @Post('create')
  async createDatabase(
    @Body() createDatabaseDto: { userId: string, planId: string, dbType: 'mysql' | 'postgresql' },
  ) {
    const { userId, planId, dbType } = createDatabaseDto;
    try {
      const result = await this.databaseService.createDatabase(userId, planId, dbType);
      return result;
    } catch (error) {
      throw new BadRequestException('Erro ao criar o banco de dados: ' + error.message);
    }
  }

  // Endpoint para obter as credenciais do banco de dados
  @Get(':userId/credentials')
  async getDatabaseCredentials(@Param('userId') userId: string) {
    try {
      const credentials = await this.databaseService.getDatabaseCredentials(userId);
      return credentials;
    } catch (error) {
      throw new BadRequestException('Erro ao obter as credenciais do banco de dados: ' + error.message);
    }
  }

  // Endpoint para visualizar as configurações do banco de dados
  @Get(':userId')
  async getDatabaseConfig(@Param('userId') userId: string) {
    try {
      const config = await this.databaseService.getDatabaseConfig(userId);
      return config;
    } catch (error) {
      throw new BadRequestException('Erro ao obter configurações do banco de dados: ' + error.message);
    }
  }

  // Endpoint para excluir o banco de dados
  @Delete(':userId')
  async deleteDatabase(@Param('userId') userId: string) {
    try {
      await this.databaseService.deleteDatabase(userId);
      return { message: 'Banco de dados excluído com sucesso.' };
    } catch (error) {
      throw new BadRequestException('Erro ao excluir o banco de dados: ' + error.message);
    }
  }
}

