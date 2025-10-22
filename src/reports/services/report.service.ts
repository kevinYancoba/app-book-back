import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ReportRepository } from '../report-repository';


@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly reportRepository: ReportRepository) {}

  
}
