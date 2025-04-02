import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as Docker from 'dockerode';
import { PrismaService } from 'src/prisma/prisma.service';
import * as tar from 'tar-fs';



@Injectable()
export class DockerService {
  private readonly docker: Docker;
  private readonly logger = new Logger(DockerService.name);
  private readonly prisma: PrismaService;

  constructor(prismaService: PrismaService) {
    this.prisma = prismaService;
    this.docker = new Docker(); // Conexão com o Docker local (ou remoto)
  }

  async createSwarmService(
    name: string,
    image: string,
    cmd: string[],
    ports: string[],
    plan: string,
    volumeNameApp: string,
    volumeNameDb: string
  ): Promise<any> {  // Changed return type to any to handle library typing issues
    // Definir os recursos com base no plano
    let cpu: number;
    let memory: number;
    let replicas: number;
    let appVolumeSize: number;
    let dbVolumeSize: number;
    let appVolumeLimit: number;
    let dbVolumeLimit: number;

    switch (plan) {
      case 'basico':
        appVolumeLimit = 1 * 1024 * 1024 * 1024; // 1 GB
        dbVolumeLimit = 1 * 1024 * 1024 * 1024;
        cpu = 500000000;
        memory = 512 * 1024 * 1024;
        replicas = 1;
        appVolumeSize = 1 * 1024 * 1024 * 1024;
        dbVolumeSize = 1 * 1024 * 1024 * 1024;
        break;
      case 'semi_pro':
        appVolumeLimit = 2 * 1024 * 1024 * 1024; // 2 GB
        dbVolumeLimit = 2 * 1024 * 1024 * 1024;
        cpu = 1000000000;
        memory = 1024 * 1024 * 1024;
        replicas = 2;
        appVolumeSize = 2 * 1024 * 1024 * 1024;
        dbVolumeSize = 2 * 1024 * 1024 * 1024;
        break;
      case 'pro':
        appVolumeLimit = 4 * 1024 * 1024 * 1024; // 4 GB
        dbVolumeLimit = 4 * 1024 * 1024 * 1024;
        cpu = 2000000000;
        memory = 2 * 1024 * 1024 * 1024;
        replicas = 3;
        appVolumeSize = 4 * 1024 * 1024 * 1024;
        dbVolumeSize = 4 * 1024 * 1024 * 1024;
        break;
      default:
        throw new BadRequestException('Plano inválido.');
    }

    if (appVolumeSize > appVolumeLimit) {
      throw new BadRequestException(`O volume do aplicativo excede o limite de tamanho do plano. Limite: ${appVolumeLimit / (1024 * 1024 * 1024)} GB.`);
    }

    if (dbVolumeSize > dbVolumeLimit) {
      throw new BadRequestException(`O volume do banco de dados excede o limite de tamanho do plano. Limite: ${dbVolumeLimit / (1024 * 1024 * 1024)} GB.`);
    }

    const appVolume: any = {
      Target: `/data/${volumeNameApp}`,
      Source: volumeNameApp,
      Type: 'volume',
    };

    const dbVolume: any = {
      Target: `/data/${volumeNameDb}`,
      Source: volumeNameDb,
      Type: 'volume',
    };

    try {
      const service = await this.docker.createService({
        Name: name,
        TaskTemplate: {
          ContainerSpec: {
            Image: image,
            Command: cmd,  // Changed from Cmd to Command which is the correct property name
            Mounts: [appVolume, dbVolume],
          },
          Resources: {
            Limits: {
              MemoryBytes: memory,
              NanoCPUs: cpu,
            },
          },
        },
        EndpointSpec: {
          Ports: ports.map((port) => ({
            PublishedPort: parseInt(port),
            TargetPort: parseInt(port),
          })),
        },
        Mode: {
          Replicated: {
            Replicas: replicas,
          },
        },
      });

      return service;
    } catch (error) {
      this.logger.error('Erro ao criar o serviço no Swarm: ', error);
      throw new BadRequestException('Erro ao criar o serviço no Docker Swarm');
    }
  }

  async ensureVolumeExists(volumeName: string): Promise<void> {
    try {
      // Verifica se o volume já existe
      const volumes = await this.docker.listVolumes();
      const volumeExists = volumes.Volumes?.some(v => v.Name === volumeName);

      if (!volumeExists) {
        // Cria o volume caso não exista
        await this.docker.createVolume({ Name: volumeName });
        this.logger.log(`Volume ${volumeName} criado.`);
      } else {
        this.logger.log(`Volume ${volumeName} já existe.`);
      }
    } catch (error) {
      this.logger.error(`Erro ao verificar/criar volume ${volumeName}:`, error);
      throw new BadRequestException(`Erro ao verificar/criar volume ${volumeName}`);
    }
  }


  // Método para escalar um serviço no Swarm (alterar o número de réplicas)
  async scaleService(serviceName: string, replicas: number): Promise<void> {
    try {
      const service = this.docker.getService(serviceName);
      await service.update({
        Mode: {
          Replicated: {
            Replicas: replicas,
          },
        },
      });
    } catch (error) {
      this.logger.error('Erro ao escalar o serviço no Swarm: ', error);
      throw new BadRequestException('Erro ao escalar o serviço no Docker Swarm');
    }
  }

  // Método para remover o serviço no Swarm
  async removeSwarmService(serviceName: string): Promise<void> {
    try {
      const service = this.docker.getService(serviceName);
      await service.remove();
    } catch (error) {
      this.logger.error('Erro ao remover o serviço no Swarm: ', error);
      throw new BadRequestException('Erro ao remover o serviço no Docker Swarm');
    }
  }

  async restartContainer(containerId: string): Promise<void> {
    const container = await this.prisma.containerInstance.findUnique({
      where: { id: containerId },
    });

    if (!container) {
      throw new NotFoundException('Container não encontrado.');
    }

    try {
      // Usando Dockerode para reiniciar o contêiner
      const dockerContainer = this.docker.getContainer(containerId);
      await dockerContainer.restart();  // Reinicia o contêiner
    } catch (error) {
      this.logger.error('Erro ao reiniciar o container: ', error);
      throw new BadRequestException('Erro ao reiniciar o container');
    }
  }

  async buildImage(repoPath: string, imageName: string): Promise<void> {
    try {
      const tarStream = tar.pack(repoPath);

      await this.docker.buildImage(tarStream, {
        t: imageName,
      });

      this.logger.log(`Imagem ${imageName} construída com sucesso.`);
    } catch (error) {
      this.logger.error(`Erro ao construir a imagem ${imageName}:`, error);
      throw new BadRequestException(`Erro ao construir a imagem.`);
    }
  }

  async stopContainer(containerName: string) {
    try {
      const container = this.docker.getContainer(containerName);
      if (!container) {
        throw new Error(`Contêiner ${containerName} não encontrado.`);
      }

      await container.stop();
      this.logger.log(`Contêiner ${containerName} parado com sucesso.`);
    } catch (error) {
      this.logger.error(`Erro ao parar contêiner ${containerName}:`, error);
      throw new Error(`Erro ao parar contêiner: ${error.message}`);
    }
  }


}


