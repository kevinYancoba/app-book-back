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
import { UserOverviewDto } from './dto/user-overview.dto';


@ApiTags('Reports & Analytics')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('overview/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Panorama general del progreso del usuario',
    description: 'Resumen completo del perfil de lectura, estadísticas de progreso y análisis de cumplimiento'
  })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Panorama general generado exitosamente',
    type: UserOverviewDto
  })
  async getUserOverview(@Param('userId', ParseIntPipe) userId: number): Promise<UserOverviewDto> {
    return await this.reportService.getUserOverview(userId);
  }
}
