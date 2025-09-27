import { UserDto } from '../dto/user.dto';
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { AuthRepository } from '../auth.repository';
import { User } from '@prisma/client';
import { LoginDto } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { PasswordResetDto } from '../dto/password-reset.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  public async createUser(user: UserDto): Promise<User> {
    try {
      user.password = await bcrypt.hash(user.password, 10);

      const userCreated = await this.authRepository.createUser(user);

      if (!userCreated) {
        throw new ConflictException('No se pudo crear el usuario');
      }

      return userCreated;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error);
    }
  }

  public async updatePassword(credential: PasswordResetDto) {
    try {
      const { email, password, code } = credential;

      // Validar el código de reset
      const isValidCode = await this.authRepository.validateResetCode(email, code);
      if (!isValidCode) {
        throw new HttpException(
          'Código de verificación inválido o expirado',
          HttpStatus.BAD_REQUEST,
        );
      }

      const newPassword = await bcrypt.hash(password, 10);

      const user = await this.authRepository.UpdatePassword(email, newPassword);

      if (!user) {
        throw new HttpException('Correo no válido', HttpStatus.UNAUTHORIZED);
      }

      // Eliminar el código de reset después de usarlo
      await this.authRepository.deleteResetCode(email, code);

      const payload = {
        sub: user.id,
        email: user.email,
        created_at: user.created_at,
      };
      const { password_hash = '', ...result } = user;
      const jwt = this.jwtService.sign(payload);

      return {
        user: result,
        acces_token: jwt,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Ocurrió un error inesperado',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async logInUser(loginUser: LoginDto) {
    try {
      const { email: emailUser, password } = loginUser;

      const user = await this.authRepository.getUserByEmail(emailUser);
      if (!user) {
        throw new HttpException('Correo no valido', HttpStatus.UNAUTHORIZED);
      }

      const comparePassword = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!comparePassword) {
        throw new HttpException('Contraseña no valida', HttpStatus.FORBIDDEN);
      }

      const payload = {
        sub: user.id,
        email: user.email,
        created_at: user.created_at,
      };
      const { password_hash, ...result } = user;
      const jwt = this.jwtService.sign(payload);

      return {
        user: result,
        acces_token: jwt,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error);
    }
  }
}
