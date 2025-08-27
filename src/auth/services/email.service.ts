import { AuthRepository } from './../auth.repository';
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {

  constructor(private readonly authRepository : AuthRepository) {}

  resend = new Resend('re_KcBmqz7X_Fujy2gtcmqVKbKjFvqAxheYo');


  generateOpt() {
    return  Math.floor(Math.random() * 9000) + 1000;
  }

  async sendResetEmail(userEamil: string) {
    const { data, error } = await this.resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['delivered@resend.dev'],
      subject: 'Code reset password',
      html: '<strong>It works!</strong>',
    });

    if (error) {
      return console.error({ error });
    }

    console.log({ data });
  }
}
