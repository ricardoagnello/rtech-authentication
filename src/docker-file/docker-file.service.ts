import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StackDetectorService } from 'src/stack-detector/stack-detector.service';

@Injectable()
export class DockerfileService {
  constructor(private readonly stackDetectorService: StackDetectorService) {}

  async generateDockerfileForStack(repoPath: string): Promise<void> {
    // Detecta a stack primeiro pelo Dockerfile, se existir
    let stack: string;
    const dockerfilePath = path.join(repoPath, 'Dockerfile');

    if (fs.existsSync(dockerfilePath)) {
      stack = this.stackDetectorService.detectStackFromDockerfile(dockerfilePath);
    } else {
      stack = await this.stackDetectorService.detectStackFromRepository(repoPath);
    }

    let dockerfileContent: string;

    switch (stack) {
      case 'node':
        dockerfileContent = `
          FROM node:alpine

          WORKDIR /app
          COPY package.json package-lock.json ./
          RUN npm install

          COPY . .

          CMD ["npm", "start"]
        `;
        break;

      case 'python':
        dockerfileContent = `
          FROM python:alpine

          WORKDIR /app
          COPY requirements.txt ./
          RUN pip install -r requirements.txt

          COPY . .

          CMD ["python", "app.py"]
        `;
        break;

      case 'ruby':
        dockerfileContent = `
          FROM ruby:alpine

          WORKDIR /app
          COPY Gemfile Gemfile.lock ./
          RUN bundle install

          COPY . .

          CMD ["ruby", "app.rb"]
        `;
        break;

      case 'go':
        dockerfileContent = `
          FROM golang:alpine

          WORKDIR /app
          COPY . .

          RUN go build -o app

          CMD ["./app"]
        `;
        break;

      case 'dotnet':
        dockerfileContent = `
          FROM mcr.microsoft.com/dotnet/aspnet:5.0

          WORKDIR /app
          COPY . .

          RUN dotnet publish -c Release -o out

          CMD ["dotnet", "out/app.dll"]
        `;
        break;

      case 'springboot':
        dockerfileContent = `
          FROM openjdk:11-jre-slim

          WORKDIR /app
          COPY target/*.jar app.jar

          CMD ["java", "-jar", "app.jar"]
        `;
        break;

      case 'php':
        dockerfileContent = `
          FROM php:7.4-apache

          WORKDIR /var/www/html
          COPY . .

          RUN docker-php-ext-install mysqli pdo pdo_mysql

          CMD ["apache2-foreground"]
        `;
        break;

      default:
        throw new Error('Stack não suportada ou não identificada.');
    }

    // Grava o Dockerfile no diretório do repositório clonado
    fs.writeFileSync(dockerfilePath, dockerfileContent.trim());
  }
}

