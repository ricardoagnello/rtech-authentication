import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StackDetectorService } from 'src/stack-detector/stack-detector.service';

@Injectable()
export class DockerfileService {
  constructor(private readonly stackDetectorService: StackDetectorService) {}

  async generateDockerfileForStack(repoPath: string): Promise<void> {
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
          # syntax=docker/dockerfile:1.4
          FROM node:alpine AS builder

          WORKDIR /app
          COPY package.json package-lock.json ./
          RUN --mount=type=cache,target=/root/.npm npm ci

          COPY . .
          RUN npm run build

          FROM node:alpine
          WORKDIR /app
          COPY --from=builder /app .
          
          CMD ["npm", "start"]
        `;
        break;

      case 'python':
        dockerfileContent = `
          # syntax=docker/dockerfile:1.4
          FROM python:alpine AS builder

          WORKDIR /app
          COPY requirements.txt ./
          RUN --mount=type=cache,target=/root/.cache pip install -r requirements.txt

          COPY . .

          CMD ["python", "app.py"]
        `;
        break;

      case 'ruby':
        dockerfileContent = `
          # syntax=docker/dockerfile:1.4
          FROM ruby:alpine AS builder

          WORKDIR /app
          COPY Gemfile Gemfile.lock ./
          RUN --mount=type=cache,target=/usr/local/bundle bundle install

          COPY . .

          CMD ["ruby", "app.rb"]
        `;
        break;

      case 'go':
        dockerfileContent = `
          # syntax=docker/dockerfile:1.4
          FROM golang:alpine AS builder

          WORKDIR /app
          COPY . .
          RUN --mount=type=cache,target=/go/pkg/mod go build -o app

          FROM alpine
          WORKDIR /app
          COPY --from=builder /app/app .
          
          CMD ["./app"]
        `;
        break;

      case 'dotnet':
        dockerfileContent = `
          # syntax=docker/dockerfile:1.4
          FROM mcr.microsoft.com/dotnet/sdk:7.0 AS builder

          WORKDIR /app
          COPY . .
          RUN --mount=type=cache,target=/root/.nuget dotnet publish -c Release -o out

          FROM mcr.microsoft.com/dotnet/aspnet:7.0
          WORKDIR /app
          COPY --from=builder /app/out .

          CMD ["dotnet", "app.dll"]
        `;
        break;

      case 'springboot':
        dockerfileContent = `
          # syntax=docker/dockerfile:1.4
          FROM openjdk:17-jdk-slim AS builder

          WORKDIR /app
          COPY . .
          RUN --mount=type=cache,target=/root/.m2 mvn clean package -DskipTests

          FROM openjdk:17-jre-slim
          WORKDIR /app
          COPY --from=builder /app/target/*.jar app.jar

          CMD ["java", "-jar", "app.jar"]
        `;
        break;

      case 'php':
        dockerfileContent = `
          # syntax=docker/dockerfile:1.4
          FROM php:8.1-apache

          WORKDIR /var/www/html
          COPY . .
          RUN docker-php-ext-install mysqli pdo pdo_mysql

          CMD ["apache2-foreground"]
        `;
        break;

      default:
        throw new Error('Stack não suportada ou não identificada.');
    }

    fs.writeFileSync(dockerfilePath, dockerfileContent.trim());
  }
}
