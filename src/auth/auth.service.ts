import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
    BadRequestException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { PrismaService } from '../prisma/prisma.service';
  import * as bcrypt from 'bcryptjs';
  import { JwtPayload, Tokens } from './interfaces';
  import { Role, User } from '@prisma/client';
  import { v4 as uuidv4 } from 'uuid';
  import { ConfigService } from '@nestjs/config';
  import { MailService } from '../mail/mail.service';
  import { SignUpDto } from './dto/sign-up.dto';
  import { SignInDto } from './dto/sign-in.dto';
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
      private readonly mailService: MailService,
    ) {}

    getFrontendUrl(): string {
        return this.configService.get('FRONTEND_URL')!; // Assumes it's always defined
      }
  
    async signUp(signUpDto: SignUpDto): Promise<User> {
        const { email, password, name } = signUpDto;
      
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });
      
        if (existingUser) {
          throw new ConflictException('Email already in use');
        }
      
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();
        const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      
        const user = await this.prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            roles: [Role.USER],
            isVerified: false,
            verificationToken,
            verificationTokenExpiresAt,
            status: 'AWAITING_SINGUP',
          },
        });
      
        await this.sendVerificationEmail(user.email, verificationToken);
      
        return user;
      }
  
    async signIn(signInDto: SignInDto): Promise<Tokens> {
      const { email, password } = signInDto;
  
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
  
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      if (!user.isVerified) {
        throw new UnauthorizedException('Please verify your email first');
      }
  
      const passwordValid = await bcrypt.compare(password, user.password);
  
      if (!passwordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      return this.generateTokens(user);
    }
  
    async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
  
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
  
      const tokenExists = await this.prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: user.id,
        },
      });
  
      if (!tokenExists) {
        throw new UnauthorizedException('Invalid refresh token');
      }
  
      await this.prisma.refreshToken.delete({
        where: { id: tokenExists.id },
      });
  
      return this.generateTokens(user);
    }
  
    async logout(userId: string, accessToken: string): Promise<void> {
        // Decode token to get expiration if needed
        const decoded = this.jwtService.decode(accessToken) as { exp?: number };
        
        await this.prisma.blacklistedToken.create({
          data: {
            token: accessToken,
            userId: userId, // Add the required userId
            expiresAt: decoded?.exp 
              ? new Date(decoded.exp * 1000) 
              : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
          },
        });
      
        await this.prisma.refreshToken.deleteMany({
          where: { userId },
        });
      }
  
    async isTokenBlacklisted(token: string): Promise<boolean> {
      const blacklisted = await this.prisma.blacklistedToken.findFirst({
        where: { token },
      });
      return !!blacklisted;
    }
  
    async generateTokens(user: User): Promise<Tokens> {
        const payload: JwtPayload = {
          sub: user.id,
          email: user.email,
          roles: user.roles,
        };
      
        const accessToken = this.jwtService.sign(payload, {
          expiresIn: this.configService.get<string>('JWT_EXPIRATION') ?? '15m',
        });
      
        const refreshToken = this.jwtService.sign(
          { sub: user.id },
          {
            expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') ?? '7d',
          },
        );
      
        // Safely get expiration with fallback (7 days in milliseconds)
        const refreshTokenExpirationMs = this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_MS') 
          ?? 7 * 24 * 60 * 60 * 1000;
        
        const expiresAt = new Date(Date.now() + refreshTokenExpirationMs);
      
        await this.prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt,
          },
        });
      
        return { accessToken, refreshToken };
      }
  
    async sendVerificationEmail(email: string, token: string): Promise<void> {
        const verificationUrl = `${this.configService.get(
          'APP_URL',
        )}/auth/verify-email?token=${token}`;
      
        await this.mailService.sendMail({
          to: email,
          subject: 'Verify your email',
          template: 'verify-email',
          context: {
            name: email.split('@')[0], // Pega o nome antes do @
            verificationUrl,
            supportEmail: 'suporte@empresa.com',
          },
        });
      }
  
    async verifyEmail(token: string): Promise<{ message: string }> {
        // 1. Encontrar o usuário com o token de verificação
        const user = await this.prisma.user.findFirst({
          where: {
            verificationToken: token,
            verificationTokenExpiresAt: {
              gt: new Date(), // Token ainda não expirou
            },
          },
        });
      
        if (!user) {
          throw new BadRequestException('Token de verificação inválido ou expirado');
        }
      
        if (user.isVerified) {
          throw new BadRequestException('Email já foi verificado anteriormente');
        }
      
        // 2. Atualizar o usuário como verificado e limpar o token
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isVerified: true,
            verificationToken: null,
            verificationTokenExpiresAt: null,
          },
        });
      
        return { message: 'Email verificado com sucesso' };
      }
  
    
  
    async resetPassword(token: string, newPassword: string): Promise<void> {
      const resetToken = await this.prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });
  
      if (!resetToken || resetToken.expiresAt < new Date()) {
        throw new BadRequestException('Invalid or expired token');
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      await this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      });
  
      await this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
    }
  
    async githubLogin(user: any): Promise<Tokens> {
      let dbUser = await this.prisma.user.findUnique({
        where: { email: user.email },
      });
  
      if (!dbUser) {
        dbUser = await this.prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            githubId: user.githubId,
            roles: [Role.USER],
            isVerified: true,
            password: await bcrypt.hash(uuidv4(), 10), // Random password
          },
        });
      } else if (!dbUser.githubId) {
        dbUser = await this.prisma.user.update({
          where: { id: dbUser.id },
          data: { githubId: user.githubId },
        });
      }
  
      return this.generateTokens(dbUser);
    }

    async resendVerificationEmail(email: string): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
          where: { email },
        });
      
        if (!user) {
          throw new NotFoundException('Usuário não encontrado');
        }
      
        if (user.isVerified) {
          throw new BadRequestException('Email já foi verificado');
        }
      
        // Gerar novo token e atualizar expiração
        const newToken = uuidv4();
        const newExpiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
      
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            verificationToken: newToken,
            verificationTokenExpiresAt: newExpiration,
          },
        });
      
        await this.sendVerificationEmail(user.email, newToken);
      
        return { message: 'Email de verificação reenviado com sucesso' };
      }
  }
