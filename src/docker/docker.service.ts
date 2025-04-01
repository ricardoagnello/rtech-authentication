import { Injectable, Logger } from '@nestjs/common';
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
  async stopContainer(container: Docker.Container): Promise<void> {
    try {
      await container.stop();
    } catch (error) {
      this.logger.error('Erro ao parar o container: ', error);
      throw error;
    }
  }

  // Método para obter o objeto de container do Docker pelo ID
  async getContainerById(containerId: string): Promise<any> {
    const container = this.docker.getContainer(containerId);
    return container;
  }
}
