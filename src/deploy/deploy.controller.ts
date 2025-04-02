import { Controller, Post, Delete, Param, Body, BadRequestException } from '@nestjs/common';
import { DeployService } from './deploy.service';

@Controller('deploy')
export class DeployController {
  constructor(private readonly deployService: DeployService) {}

  @Post(':userId')
  async deploy(@Param('userId') userId: string, @Body() body: { repoUrl: string; envVars: Record<string, string> }) {
    if (!body.repoUrl) {
      throw new BadRequestException('O campo repoUrl é obrigatório.');
    }
    return this.deployService.deployApp(userId, body.repoUrl, body.envVars || {});
  }

  @Post(':userId/restart')
  async restart(@Param('userId') userId: string) {
    return this.deployService.restartApp(userId);
  }

  @Post(':userId/stop')
  async stop(@Param('userId') userId: string) {
    return this.deployService.stopApp(userId);
  }

  @Delete(':userId')
  async delete(@Param('userId') userId: string) {
    return this.deployService.deleteApp(userId);
  }
}

