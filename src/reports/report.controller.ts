import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ReportService } from './services/report.service';


@ApiTags('Reports & Analytics')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  
}
