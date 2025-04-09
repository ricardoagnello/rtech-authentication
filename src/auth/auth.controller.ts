import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { MailService } from 'src/mail/mail.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) { }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto) {
    const user = await this.authService.signUp(signUpDto);
    return {
      message: 'Registro realizado com sucesso. Verifique seu email para ativar sua conta.',
      userId: user.id,
    };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: Request & { user: { sub: string; refreshToken: string } }) {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    // Type assertion for req.user
    const userId = (req as any).user.sub; // Quick fix: Treat 'req' as 'any' to bypass TS error

    // Type assertion + null check for authorization header
    const authorizationHeader = req.headers['authorization'] as string;
    if (!authorizationHeader) {
      throw new BadRequestException('Authorization header is missing');
    }

    const accessToken = authorizationHeader.replace('Bearer ', '');
    await this.authService.logout(userId, accessToken);
    return { message: 'Logout realizado com sucesso' };
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token de verificação é obrigatório');
    }
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(resendVerificationDto.email);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Inicia o fluxo OAuth do GitHub
  }

  @Get('github/callback')
@UseGuards(AuthGuard('github'))
async githubAuthCallback(@Req() req: Request) {
  const user = (req as any).user;
  const tokens = await this.authService.githubLogin(user);
  
  return { access_token: tokens.accessToken, refresh_token: tokens.refreshToken };
}

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const resetUrl = `https://your-app-url.com/reset-password?email=${forgotPasswordDto.email}`;
    await this.mailService.sendPasswordResetEmail(forgotPasswordDto.email, resetUrl);
    return { message: 'Email de redefinição de senha enviado com sucesso' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
    return { message: 'Senha redefinida com sucesso' };
  }

  @Post('signup-token')
async requestSignupToken(@Body('email') email: string) {
  const token = await this.authService.generateSignupToken(email);
  return { token };
}
}