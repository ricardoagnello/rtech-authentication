import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly mailerService: MailerService, private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('GMAIL_USER'),
        pass: this.configService.get('GMAIL_PASSWORD'),
      },
    });
  }

  async sendMail({
    to,
    subject,
    template,
    context,
  }: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }): Promise<void> {
    let html: string = '';

    // In a real app, you would use a template engine like Handlebars
    if (template === 'verify-email') {
        html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Olá ${context.name},</h2>
          <p>Obrigado por se registrar em nosso serviço!</p>
          <p>Por favor, clique no link abaixo para verificar seu endereço de email:</p>
          <p style="margin: 20px 0;">
            <a href="${context.verificationUrl}" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px;">
              Verificar Email
            </a>
          </p>
          <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all;">${context.verificationUrl}</p>
          <p>Este link expirará em 24 horas.</p>
          <p>Caso não tenha solicitado este email, por favor ignore esta mensagem.</p>
          <p style="margin-top: 30px;">Atenciosamente,<br>Equipe de Suporte</p>
          <p style="font-size: 12px; color: #777;">
            Se precisar de ajuda, entre em contato com ${context.supportEmail}
          </p>
        </div>
      `;
    } else {
      throw new Error(`Unknown email template: ${template}`);
    }

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to,
      subject,
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetUrl: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Redefinição de Senha',
      template: './reset-password', // Nome do arquivo sem extensão
      context: {
        resetUrl,
        expiration: '24', // Horas até expirar
      },
    });
  }
}

  

