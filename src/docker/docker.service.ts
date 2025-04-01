import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as Docker from 'dockerode';


@Injectable()
export class DockerService {
  private readonly docker: Docker;
  private readonly logger = new Logger(DockerService.name);

  constructor() {
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

    switch (plan) {
      case 'basico':
        cpu = 500000000;
        memory = 512 * 1024 * 1024;
        replicas = 1;
        appVolumeSize = 1 * 1024 * 1024 * 1024;
        dbVolumeSize = 1 * 1024 * 1024 * 1024;
        break;
      case 'semi_pro':
        cpu = 1000000000;
        memory = 1024 * 1024 * 1024;
        replicas = 2;
        appVolumeSize = 2 * 1024 * 1024 * 1024;
        dbVolumeSize = 2 * 1024 * 1024 * 1024;
        break;
      case 'pro':
        cpu = 2000000000;
        memory = 2 * 1024 * 1024 * 1024;
        replicas = 3;
        appVolumeSize = 4 * 1024 * 1024 * 1024;
        dbVolumeSize = 4 * 1024 * 1024 * 1024;
        break;
      default:
        throw new BadRequestException('Plano inválido.');
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
}
