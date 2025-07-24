import { Injectable } from '@nestjs/common';
import { DatabaseService } from './../database/database.service';
import { UserDto } from './dto/user.dto';
import { User } from '@prisma/client';

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

  async getUserByEmail(email: string) : Promise<User | undefined>{
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        }
      });

      return user || undefined
     
    } catch (error) { return undefined}
  }
}
