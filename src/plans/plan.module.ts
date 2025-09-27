import { Module } from '@nestjs/common';
import { PlanService } from './services/plan.service';
import { PlanController } from './plan.controller';
import { BooksService } from 'src/books/services/books.service';
import { BooksModule } from 'src/books/books.module';
import { PlanRepository } from './plan-repository';

@Module({
  providers: [PlanService, PlanRepository],
  controllers: [PlanController],
  imports : [BooksModule]
})
export class PlanModule {}
