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
import { emit } from 'process';

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
        throw new HttpException('Invalid Email', HttpStatus.FORBIDDEN);
      }

      const newCode: string = this.generateOpt().toString();
      const resetPassworDetail = this.authRepository.createCodeReset(
        newCode,
        user,
      );

      if (!resetPassworDetail) {
        throw new HttpException(
          'Invalid Email',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const isSendEmail = await this.sendResetEmail(user, newCode);
      if (!isSendEmail) {
        throw new ConflictException(
          'Ocurrio un erro al enviar el corero de recuperacion',
        );
      }
      return resetPassworDetail;
    } catch (error) {
      throw new HttpException(
        `Ocurrio un error inesperado ${error} `,
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
      .replace(/{{MINUTES}}/g, '10')
      .replace(/{{USER_NAME}}/g, user.name ? ` ${user.name} ` : '')
      .replace(/{{YEAR}}/g, String(new Date().getFullYear()));

    const { data, error } = await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'kvinquiej@gmail.com',
      // to: [user.email],
      subject: 'Code reset password',
      html: html,
    });

    if (error) {
      return false;
      console.error({ error });
    }
    return true;
    console.log({ data });
  }
}
