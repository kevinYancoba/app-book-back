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
import { JwtService } from '@nestjs/jwt';

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

  public async logInUser(loginUser: LoginDto) {
    try {
      const { email: emailUser, password } = loginUser;
      const user = await this.authRepository.getUserByEmail(emailUser);
      if (!user) {
        throw new HttpException('Invalid email', HttpStatus.UNAUTHORIZED);
      }

      const comparePassword = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!comparePassword) {
        throw new HttpException('Invalid Password', HttpStatus.FORBIDDEN);
      }

      const payload = {
        sub: user.id,
        email: user.email,
        created_at: user.created_at,
      };
      const {password_hash, ...result } = user
      const jwt = this.jwtService.sign(payload);

      return {
        user : result,
        acces_token: jwt,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(error);
    }
  }
}
