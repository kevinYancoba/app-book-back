import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class EmailResetDto {
  @ApiProperty({
    example: 'jhon@gmail.com',
    description: 'Email del usuario para enviar código de recuperación'
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
