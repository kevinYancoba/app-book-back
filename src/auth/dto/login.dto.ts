import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'jhon@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'usuario123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
