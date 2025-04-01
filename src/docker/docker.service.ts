import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as Docker from 'dockerode';


@Injectable()
export class DockerService {
  private readonly docker: Docker;
  private readonly logger = new Logger(DockerService.name);

  constructor() {
    this.docker = new Docker(); // Conexão com o Docker local (ou remoto)
  }

  // Método para criar um container
  async createContainer(name: string, image: string, cmd: string[], ports: string[]): Promise<Docker.Container> {
    try {
      const container = await this.docker.createContainer({
        name: name,
        Image: image,
        Cmd: cmd,
        ExposedPorts: ports.reduce((acc, port) => ({ ...acc, [`${port}/tcp`]: {} }), {}),
        HostConfig: {
          PortBindings: ports.reduce((acc, port) => ({
            ...acc,
            [`${port}/tcp`]: [{ HostPort: port }],
          }), {}),
        },
      });
      return container;
    } catch (error) {
      this.logger.error('Erro ao criar o container: ', error);
      throw error;
    }
  }

  // Método para iniciar o container
  async startContainer(container: Docker.Container): Promise<void> {
    try {
      await container.start();
    } catch (error) {
      this.logger.error('Erro ao iniciar o container: ', error);
      throw error;
    }
  }

  // Método para parar o container
  async stopContainer(containerName: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerName);
  
      if (!container) {
        throw new NotFoundException(`Container '${containerName}' não encontrado.`);
      }
  
      await container.stop();
    } catch (error) {
      console.error(`Erro ao parar o container '${containerName}':`, error.message);
  
      throw new BadRequestException(`Não foi possível parar o container: ${error.message}`);
    }
  }
  

  // Método para obter o objeto de container do Docker pelo ID
  async getContainerById(containerId: string): Promise<any> {
    try {
      const container = this.docker.getContainer(containerId);
      if (!container) {
        throw new NotFoundException(`Container com ID ${containerId} não encontrado.`);
      }
      return container;
    } catch (error) {
      console.error(`Erro ao buscar container ${containerId}:`, error.message);
      throw new Error(`Falha ao obter container: ${error.message}`);
    }
  }
  

  async removeContainer(containerName: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerName);
      await container.remove();
      console.log(`Container ${containerName} removido com sucesso.`);
    } catch (error) {
      console.error(`Erro ao remover o container ${containerName}:`, error.message);
      throw new Error(`Falha ao remover container: ${error.message}`);
    }
  }
}
