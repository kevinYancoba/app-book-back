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
import { TransformDtoInterceptor } from 'src/shared/interceptors/transform-dto.interceptor';
import {
  DashboardFiltersDto,
  CompleteDashboardDto,
  QuickDashboardDto,
  ComparativeAnalysisDto,
  RealTimeMetricsDto,
  PeriodTypeEnum
} from './dto';

@ApiTags('Reports & Analytics')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // ==================== DASHBOARDS ====================

  @Get('dashboard/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dashboard completo de progreso',
    description: 'Obtiene un análisis completo del progreso de lectura con métricas, tendencias y recomendaciones'
  })
  @ApiQuery({ name: 'userId', description: 'ID del usuario', type: 'number' })
  @ApiQuery({ name: 'period', description: 'Período de análisis', enum: PeriodTypeEnum, required: false })
  @ApiQuery({ name: 'startDate', description: 'Fecha de inicio (YYYY-MM-DD)', required: false })
  @ApiQuery({ name: 'endDate', description: 'Fecha de fin (YYYY-MM-DD)', required: false })
  @ApiResponse({
    status: 200,
    description: 'Dashboard completo generado exitosamente',
    type: CompleteDashboardDto
  })
  @UseInterceptors(new TransformDtoInterceptor())
  async getCompleteDashboard(@Query() filters: DashboardFiltersDto): Promise<any> {
    return await this.reportService.generateCompleteDashboard(filters);
  }

  @Get('dashboard/quick/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dashboard rápido diario',
    description: 'Vista rápida del progreso del día actual con métricas clave y tareas pendientes'
  })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard rápido generado exitosamente',
    type: QuickDashboardDto
  })
  async getQuickDashboard(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    return await this.reportService.generateQuickDashboard(userId);
  }

  @Get('analytics/trends/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Análisis de tendencias',
    description: 'Análisis detallado de tendencias de lectura y patrones de comportamiento'
  })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'number' })
  @ApiQuery({ name: 'period', description: 'Período de análisis', enum: PeriodTypeEnum, required: false })
  @ApiResponse({
    status: 200,
    description: 'Análisis de tendencias generado exitosamente'
  })
  async getTrendAnalysis(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('period') period?: PeriodTypeEnum
  ): Promise<any> {
    const filters: DashboardFiltersDto = { userId, period };
    const dashboard = await this.reportService.generateCompleteDashboard(filters);
    return {
      tendencias: dashboard.tendencias,
      rendimiento: dashboard.rendimiento
    };
  }

  @Get('analytics/performance/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Análisis de rendimiento',
    description: 'Métricas detalladas de rendimiento de lectura, velocidad y consistencia'
  })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'number' })
  @ApiQuery({ name: 'period', description: 'Período de análisis', enum: PeriodTypeEnum, required: false })
  @ApiResponse({
    status: 200,
    description: 'Análisis de rendimiento generado exitosamente'
  })
  async getPerformanceAnalysis(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('period') period?: PeriodTypeEnum
  ): Promise<any> {
    const filters: DashboardFiltersDto = { userId, period };
    const dashboard = await this.reportService.generateCompleteDashboard(filters);
    return {
      rendimiento: dashboard.rendimiento,
      metricas: dashboard.metricas,
      alertasRecomendaciones: dashboard.alertasRecomendaciones
    };
  }

  @Get('alerts/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alertas y recomendaciones',
    description: 'Obtiene alertas personalizadas y recomendaciones para mejorar el rendimiento'
  })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Alertas y recomendaciones obtenidas exitosamente'
  })
  async getAlertsAndRecommendations(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    const filters: DashboardFiltersDto = { userId, period: PeriodTypeEnum.WEEK };
    const dashboard = await this.reportService.generateCompleteDashboard(filters);
    return dashboard.alertasRecomendaciones;
  }

  @Get('summary/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resumen ejecutivo',
    description: 'Resumen conciso de las métricas más importantes del usuario'
  })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Resumen ejecutivo generado exitosamente'
  })
  async getExecutiveSummary(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    const [quickDashboard, weeklyDashboard] = await Promise.all([
      this.reportService.generateQuickDashboard(userId),
      this.reportService.generateCompleteDashboard({
        userId,
        period: PeriodTypeEnum.WEEK
      })
    ]);

    return {
      resumenDiario: quickDashboard.metricas,
      resumenSemanal: {
        consistencia: weeklyDashboard.rendimiento.consistencia.porcentajeConsistencia,
        velocidadPromedio: weeklyDashboard.rendimiento.velocidadLectura.velocidadPromedio,
        paginasTotales: weeklyDashboard.metricas.metricas.totalPaginasLeidas,
        tiempoTotal: weeklyDashboard.metricas.metricas.totalTiempoInvertido
      },
      alertasPrioritarias: weeklyDashboard.alertasRecomendaciones.alertas
        .filter(a => a.severidad === 'ALTA')
        .slice(0, 3),
      proximosLogros: weeklyDashboard.alertasRecomendaciones.logros.slice(0, 2)
    };
  }
}
