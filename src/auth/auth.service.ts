import { UserDto } from './dto/user.dto';
import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { User } from '@prisma/client';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

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

  public async logInUser(loginUser: LoginDto) {
    try {
      const { email, password } = loginUser;
      const passwordUser = await this.authRepository.getUserByEmail(email);
      if (!passwordUser) {
        throw new HttpException('Invalid email', HttpStatus.UNAUTHORIZED);
      }

      const comparePassword = await bcrypt.compare(
        password,
        passwordUser.password_hash,
      );
      if (!comparePassword) {
        throw new HttpException('Invalid Password', HttpStatus.FORBIDDEN);
      }

      return passwordUser;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error);
    }
  }
}
