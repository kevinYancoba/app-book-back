import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BooksModule } from './books/books.module';
import { PlanModule } from './plans/plan.module';
import { PlanRepository } from './plans/plan-repository';
import { PlanService } from './plans/services/plan.service';
import { ReportModule } from './reports/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    DatabaseModule,
    BooksModule,
    PlanModule,
    ReportModule,
  ],
  controllers: [],
  providers: [PlanRepository,PlanService],
})
export class AppModule {}
