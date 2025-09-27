import { User } from '@prisma/client';
import { AuthRepository } from './../auth.repository';
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Resend } from 'resend';
import { EmailResetDto } from '../dto/email-reset.dto';

@Injectable()
export class EmailService {
  resend = new Resend(process.env.RESEND_API_KEY);
  TEMPLATE_HTML: string;

  constructor(private readonly authRepository: AuthRepository) {
    this.TEMPLATE_HTML = readFileSync(
      join(__dirname, '../../../src/auth/email/template/code-resset.html'),
      'utf8',
    );
  }

  async getCodeReset(emailDto: EmailResetDto) {
    try {
      const user = await this.authRepository.getUserByEmail(emailDto.email);
      if (!user) {
        throw new HttpException(
          'No se encontró un usuario con este email',
          HttpStatus.NOT_FOUND,
        );
      }

      const newCode: string = this.generateOpt().toString();
      const resetPassworDetail = await this.authRepository.createCodeReset(
        newCode,
        user,
      );

      if (!resetPassworDetail) {
        throw new HttpException(
          'Error al generar código de recuperación',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const isSendEmail = await this.sendResetEmail(user, newCode);
      if (!isSendEmail) {
        throw new ConflictException(
          'Error al enviar el correo de recuperación. Inténtalo de nuevo.',
        );
      }

      return {
        message: 'Código de recuperación enviado exitosamente',
        email: user.email,
        expiresIn: '15 minutos',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Ocurrió un error inesperado al procesar la solicitud',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  generateOpt() {
    return Math.floor(Math.random() * 9000) + 1000;
  }

  async sendResetEmail(user: User, code: string): Promise<boolean> {
    const html = this.TEMPLATE_HTML
      .replace(/{{CODE}}/g, code)
      .replace(/{{MINUTES}}/g, '15') // Actualizado a 15 minutos como en el código
      .replace(/{{USER_NAME}}/g, user.name ? ` ${user.name} ` : '')
      .replace(/{{YEAR}}/g, String(new Date().getFullYear()));

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: [user.email], // Enviar al email del usuario
        subject: 'Código de recuperación de contraseña - TrackBook',
        html: html,
      });

      if (error) {
        console.error('Error sending email:', error);
        return false;
      }

      console.log('Email sent successfully:', data);
      return true;
    } catch (error) {
      console.error('Error in sendResetEmail:', error);
      return false;
    }
  }
}
