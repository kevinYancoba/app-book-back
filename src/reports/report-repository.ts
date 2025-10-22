import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ReportRepository {
  private readonly logger = new Logger(ReportRepository.name);

  constructor(private readonly prisma: DatabaseService) {}

  
}
