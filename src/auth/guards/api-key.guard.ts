import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];

        if (!apiKey) {
            throw new ForbiddenException('API Key não fornecida');
        }

        const validApiKey = this.configService.get<string>('API_KEY');

        if (apiKey !== validApiKey) {
            throw new ForbiddenException('API Key inválida');
        }

        return true;
    }
}