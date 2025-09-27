import { IsEmail, MinLength, IsNotEmpty } from 'class-validator';
export class PasswordResetDto {
  @IsNotEmpty()
  @IsEmail()
  public email: string;
  @IsNotEmpty()
  @MinLength(6)
  public password: string;
}
