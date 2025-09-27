import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { BooksModule } from './books/books.module';
import { PlanModule } from './plans/plan.module';
import { PlanRepository } from './plans/plan-repository';
import { PlanService } from './plans/services/plan.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    DatabaseModule,
    BooksModule,
    PlanModule,
  ],
  controllers: [],
  providers: [PlanRepository,PlanService],
})
export class AppModule {}
