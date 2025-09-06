import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class EmailResetDto {
  @ApiProperty({ example: 'jhon@gmail.com' })
  @IsEmail()
  email: string;
}
