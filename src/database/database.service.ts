import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DockerService } from 'src/docker/docker.service';
import { LogsGateway } from 'src/logs/logs.gateway';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dockerService: DockerService,
    private readonly logsGateway: LogsGateway,
  ) {}

  async createDatabase(
    userId: string,
    planId: string,
    dbType: 'mysql' | 'postgresql',
  ): Promise<{ message: string; credentials: any }> {
    this.logsGateway.sendLog(userId, `Criando banco de dados do tipo ${dbType}...`);
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new BadRequestException('Plano não encontrado.');
    }
  
    const credentials = this.generateDatabaseCredentials();
    const volumeNameDb = `db-volume-${userId}-${dbType}`;
    const serviceName = `${userId}-${dbType}-db`;
  
    let cmd: string[];
    let port: number;
    let image: string;
  
    switch (dbType) {
      case 'mysql':
        cmd = ['docker-entrypoint.sh', 'mysqld'];
        port = 3306;
        image = 'mysql:latest';
        break;
      case 'postgresql':
        cmd = ['docker-entrypoint.sh', 'postgres'];
        port = 5432;
        image = 'postgres:latest';
        break;
      default:
        throw new BadRequestException('Tipo de banco de dados inválido.');
    }
  
    try {
      this.logsGateway.sendLog(userId, `Criando volume para o banco ${dbType}...`);
      // Garante que o volume exista antes de criar o serviço
      await this.dockerService.ensureVolumeExists(volumeNameDb);
      
      this.logsGateway.sendLog(userId, `Criando serviço Docker Swarm para ${dbType}...`);
      await this.dockerService.createSwarmService(
        serviceName,
        image,
        cmd,
        [port.toString()],
        plan.name.toLowerCase(),
        volumeNameDb, // Passando apenas o volume do banco corretamente
        volumeNameDb, 
      );
  
      await this.prisma.database.create({
        data: {
          userId,
          planId,
          dbType,
          host: serviceName, // Nome do serviço, e não localhost
          port,
          username: credentials.username,
          password: credentials.password,
          dbName: `${userId}_db`,
        },
      });
  
      const envFileContent = `DB_HOST=${serviceName}\nDB_PORT=${port}\nDB_USERNAME=${credentials.username}\nDB_PASSWORD=${credentials.password}\nDB_NAME=${userId}_db`;
  
      this.saveEnvFile(envFileContent, userId);
      
      this.logsGateway.sendLog(userId, `Banco ${dbType} criado com sucesso!`);
      return { message: 'Banco de dados criado com sucesso!', credentials };
    } catch (error) {
      this.logger.error('Erro ao criar o banco de dados: ', error);
      throw new BadRequestException('Erro ao criar o banco de dados no Docker Swarm');
    }
  }
  

  async getDatabaseCredentials(userId: string) {
    const db = await this.prisma.database.findFirst({ where: { userId } });
    if (!db) {
      throw new BadRequestException('Banco de dados não encontrado.');
    }
    return { username: db.username, password: db.password };
  }

  async getDatabaseConfig(userId: string) {
    const db = await this.prisma.database.findFirst({ where: { userId } });
    if (!db) {
      throw new BadRequestException('Banco de dados não encontrado.');
    }
    return {
      host: db.host,
      port: db.port,
      username: db.username,
      dbName: db.dbName,
    };
  }

  async deleteDatabase(userId: string) {
    const db = await this.prisma.database.findFirst({ where: { userId } });
    if (!db) {
      throw new BadRequestException('Banco de dados não encontrado.');
    }
    this.logsGateway.sendLog(userId, `Removendo banco de dados ${db.dbType}...`);
    await this.dockerService.removeSwarmService(`${userId}-${db.dbType}-db`);
    await this.prisma.database.deleteMany({ where: { userId } });
    
    this.logsGateway.sendLog(userId, `Banco de dados ${db.dbType} removido com sucesso.`);
    this.logger.log('Banco de dados excluído com sucesso.');
  }

  private generateDatabaseCredentials() {
    const username = `user_${Math.random().toString(36).substring(7)}`;
    const password = Math.random().toString(36).substring(7);
    return { username, password };
  }

  private saveEnvFile(content: string, userId: string) {
    const fs = require('fs');
    const path = `./.env-${userId}`;
    fs.writeFileSync(path, content, 'utf8');
    this.logger.log(`Arquivo .env gerado em: ${path}`);
  }
}
