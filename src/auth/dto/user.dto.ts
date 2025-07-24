import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class UserDto {
  @ApiProperty({ example: 'Jhon' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Carson' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'jhon@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'usuario123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
