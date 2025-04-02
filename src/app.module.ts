import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PlanModule } from './plan/plan.module';
import { ContainerInstanceModule } from './container-instance/container-instance.module';
import { DockerService } from './docker/docker.service';
import { ContainerMonitorService } from './container-monitor/container-monitor.service';
import { DatabaseModule } from './database/database.module';
import { RepositoryModule } from './repository/repository.module';
import { StackDetectorModule } from './stack-detector/stack-detector.module';
import { DockerFileModule } from './docker-file/docker-file.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({}),
    PassportModule.register({ session: false }),
    AuthModule,
    PrismaModule,
    MailModule,
    PlanModule,
    ContainerInstanceModule,
    DatabaseModule,
    RepositoryModule,
    StackDetectorModule,
    DockerFileModule,
    
  ],
  providers: [DockerService, ContainerMonitorService],
})
export class AppModule {}
