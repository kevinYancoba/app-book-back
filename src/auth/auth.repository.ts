import { Injectable } from '@nestjs/common';
import { DatabaseService } from './../database/database.service';
import { UserDto } from './dto/user.dto';
import { User } from '@prisma/client';
import { addMinutes } from 'date-fns';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: DatabaseService) {}

  async createUser(user: UserDto): Promise<User | undefined> {
    try {
      const createdUser = await this.prisma.user.create({
        data: {
          name: user.name,
          last_name: user.lastName,
          email: user.email,
          password_hash: user.password,
          created_at: new Date(),
        },
      });

      return createdUser;
    } catch (error) {
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      return user || undefined;
    } catch (error) {
      return undefined;
    }
  }

  async createCodeResetPassword(code: string, user: User) {
    
    const expiresAt = addMinutes(new Date(), 15);

    try {
      const resetCodePasswor = await this.prisma.passwordReset.create({
        data: {
          user_id: user.id,
          reset_code: code,
          expires_at: expiresAt,
          created_at: new Date(),
        },
      });

      return resetCodePasswor;
    } catch (error) {
      return undefined;
    }
  }
}
