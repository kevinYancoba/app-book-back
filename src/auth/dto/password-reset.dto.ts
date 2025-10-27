import { IsEmail, MinLength, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordResetDto {
  @ApiProperty({ example: 'jhon@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsNotEmpty()
  @MinLength(6)
  public password: string;

  @ApiProperty({ example: '1234', description: 'Código de 4 dígitos enviado por email' })
  @IsNotEmpty()
  @IsString()
  @Length(4, 4, { message: 'El código debe tener exactamente 4 dígitos' })
  public code: string;
}
