import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import simpleGit, { SimpleGit } from 'simple-git'; // Para clonar o repositório via Git
import { promisify } from 'util';

@Injectable()
export class RepositoryService {
    private readonly git: SimpleGit = simpleGit();

    // Clona o repositório e retorna o caminho local do repositório clonado
    async cloneRepository(repoUrl: string): Promise<string> {
        const cloneDir = path.join(__dirname, 'tmp', Date.now().toString());

        // Clona o repositório no diretório temporário
        await this.git.clone(repoUrl, cloneDir);

        // Verifica se o repositório foi clonado corretamente
        if (!fs.existsSync(cloneDir)) {
            throw new Error('Falha ao clonar o repositório.');
        }
        return cloneDir;
    }
}
