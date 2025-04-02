import { Injectable } from '@nestjs/common';
import { RepositoryService } from 'src/repository/repository.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StackDetectorService {
  constructor(private readonly repositoryService: RepositoryService) {}

  async detectStackFromRepository(repoUrl: string): Promise<string> {
    const repoPath = await this.repositoryService.cloneRepository(repoUrl);
    const files = fs.readdirSync(repoPath);

    if (files.includes('Dockerfile')) {
      return this.detectStackFromDockerfile(path.join(repoPath, 'Dockerfile'));
    }

    if (files.includes('package.json')) {
      return 'node';
    }
    if (files.includes('requirements.txt')) {
      return 'python';
    }
    if (files.includes('Gemfile')) {
      return 'ruby';
    }
    if (files.includes('go.mod')) {
      return 'go';
    }
    if (files.some(file => file.endsWith('.jar'))) {
      return 'springboot';
    }
    if (files.includes('composer.json')) {
      return 'php';
    }

    throw new Error('Stack não identificada.');
  }

  public detectStackFromDockerfile(dockerfilePath: string): string {
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8').toLowerCase();

    if (dockerfileContent.includes('node')) return 'node';
    if (dockerfileContent.includes('python')) return 'python';
    if (dockerfileContent.includes('ruby')) return 'ruby';
    if (dockerfileContent.includes('golang')) return 'go';
    if (dockerfileContent.includes('openjdk') || dockerfileContent.includes('adoptopenjdk')) return 'springboot';
    if (dockerfileContent.includes('php')) return 'php';

    return 'stack não identificada';
  }
}
