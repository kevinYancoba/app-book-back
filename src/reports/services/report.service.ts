import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ReportRepository } from '../report-repository';
import {
  DashboardFiltersDto,
  PeriodTypeEnum,
  CompleteDashboardDto,
  QuickDashboardDto,
  ComparativeAnalysisDto,
  RealTimeMetricsDto,
} from '../dto';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly reportRepository: ReportRepository) {}

  async generateCompleteDashboard(
    filters: DashboardFiltersDto,
  ): Promise<CompleteDashboardDto> {
    try {
      this.logger.log(
        `Generando dashboard completo para usuario ${filters.userId}`,
      );

      if (!filters.userId) {
        throw new HttpException(
          'ID de usuario es requerido',
          HttpStatus.BAD_REQUEST,
        );
      }

      const { startDate, endDate } = this.calculatePeriodDates(
        filters.period,
        filters.startDate,
        filters.endDate,
      );

      // Obtener todos los datos en paralelo
      const [
        generalMetrics,
        trendData,
        weeklyPatterns,
        activePlans,
        speedAnalysis,
        consistencyAnalysis,
      ] = await Promise.all([
        this.reportRepository.getUserGeneralMetrics(
          filters.userId,
          startDate,
          endDate,
        ),
        this.reportRepository.getDailyTrendData(
          filters.userId,
          startDate,
          endDate,
        ),
        this.reportRepository.getWeeklyPatterns(
          filters.userId,
          startDate,
          endDate,
        ),
        this.reportRepository.getActivePlansWithDetails(filters.userId),
        this.reportRepository.getReadingSpeedAnalysis(
          filters.userId,
          startDate,
          endDate,
        ),
        this.reportRepository.getConsistencyAnalysis(
          filters.userId,
          startDate,
          endDate,
        ),
      ]);

      if (!generalMetrics) {
        throw new HttpException(
          'No se pudieron obtener las métricas del usuario',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Construir el dashboard completo
      const dashboard: CompleteDashboardDto = {
        informacion: {
          userId: filters.userId,
          userName: 'Usuario', // Se puede obtener de la base de datos
          periodoAnalisis: filters.period || 'MONTH',
          fechaInicio: startDate,
          fechaFin: endDate,
          fechaGeneracion: new Date(),
        },
        metricas: {
          metricas: {
            totalLibrosLeidos: generalMetrics.totalLibrosLeidos,
            totalPaginasLeidas: generalMetrics.totalPaginasLeidas,
            totalTiempoInvertido: generalMetrics.totalTiempoInvertido,
            promedioTiempoDiario: generalMetrics.promedioTiempoDiario,
            velocidadLecturaPromedio: generalMetrics.velocidadLecturaPromedio,
            librosEnProgreso: generalMetrics.librosEnProgreso,
            planesActivos: generalMetrics.planesActivos,
          },
          comparacion: {
            paginasLeidasCambio: 0, // Se calculará con datos históricos
            tiempoInvertidoCambio: 0,
            velocidadLecturaCambio: 0,
            consistenciaCambio: 0,
          },
          objetivos: {
            metaPaginasDiarias: 20, // Se puede obtener del perfil del usuario
            metaTiempoDiario: 60,
            progresoMetaPaginas:
              (generalMetrics.promedioTiempoDiario / 20) * 100,
            progresoMetaTiempo:
              (generalMetrics.promedioTiempoDiario / 60) * 100,
            diasConsecutivos: consistencyAnalysis?.rachaActual || 0,
            mejorRacha: consistencyAnalysis?.mejorRacha || 0,
          },
        },
        tendencias: {
          tendenciaDiaria: trendData.map((item: any) => ({
            ...item,
            completado: item.completado === null ? false : item.completado,
          })),
          patronesSemana: weeklyPatterns || {
            mejorDiaSemana: 'N/A',
            peorDiaSemana: 'N/A',
            promedioFinesSemana: 0,
            promedioEntresemana: 0,
            consistenciaGeneral: 0,
          },
          predicciones: this.generatePredictions(
            generalMetrics,
            trendData,
            activePlans,
          ),
        },
        rendimiento: {
          velocidadLectura: speedAnalysis || {
            velocidadActual: 0,
            velocidadPromedio: 0,
            velocidadMaxima: 0,
            velocidadMinima: 0,
            tendenciaVelocidad: 'ESTABLE' as const,
            factoresInfluencia: [],
          },
          consistencia: consistencyAnalysis || {
            diasCompletados: 0,
            diasTotales: 0,
            porcentajeConsistencia: 0,
            rachaActual: 0,
            mejorRacha: 0,
            diasSinLeer: 0,
          },
          dificultad: {
            dificultadPromedio: 3.0,
            librosCompletos: generalMetrics.totalLibrosLeidos,
            librosAbandonados: 0,
            tiempoPromedioCapitulo: generalMetrics.promedioTiempoDiario,
            capitulosMasDificiles: [],
          },
        },
        alertasRecomendaciones: this.generateAlertsAndRecommendations(
          generalMetrics,
          consistencyAnalysis,
          speedAnalysis,
          activePlans,
        ),
        planesActivos: activePlans,
      };

      this.logger.log(
        `Dashboard completo generado para usuario ${filters.userId}`,
      );
      return dashboard;
    } catch (error) {
      this.logger.error(
        `Error al generar dashboard completo: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al generar el dashboard',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Generar dashboard rápido
  async generateQuickDashboard(userId: number): Promise<QuickDashboardDto> {
    try {
      this.logger.log(`Generando dashboard rápido para usuario ${userId}`);

      if (!userId || userId <= 0) {
        throw new HttpException(
          'ID de usuario inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Obtener datos del día actual
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const [todayMetrics, todayTasks, consistencyData] = await Promise.all([
        this.reportRepository.getUserGeneralMetrics(
          userId,
          startOfDay,
          endOfDay,
        ),
        this.reportRepository.getTodayTasks(userId),
        this.reportRepository.getConsistencyAnalysis(
          userId,
          new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
          today,
        ),
      ]);

      const quickDashboard: QuickDashboardDto = {
        metricas: {
          paginasLeidasHoy: todayMetrics?.totalPaginasLeidas || 0,
          tiempoInvertidoHoy: todayMetrics?.totalTiempoInvertido || 0,
          metaDiariaAlcanzada: (todayMetrics?.totalPaginasLeidas || 0) >= 20, // Meta por defecto
          rachaActual: consistencyData?.rachaActual || 0,
          progresoSemanal: consistencyData?.porcentajeConsistencia || 0,
        },
        tareasHoy: todayTasks,
        alertas: this.generateQuickAlerts(todayMetrics, consistencyData),
      };

      this.logger.log(`Dashboard rápido generado para usuario ${userId}`);
      return quickDashboard;
    } catch (error) {
      this.logger.error(
        `Error al generar dashboard rápido: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al generar el dashboard rápido',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private calculatePeriodDates(
    period?: PeriodTypeEnum,
    startDate?: Date,
    endDate?: Date,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();

    if (period === PeriodTypeEnum.CUSTOM && startDate && endDate) {
      return { startDate, endDate };
    }

    let calculatedStartDate: Date;
    let calculatedEndDate = new Date(now);

    switch (period) {
      case PeriodTypeEnum.WEEK:
        calculatedStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case PeriodTypeEnum.QUARTER:
        calculatedStartDate = new Date(
          now.getTime() - 90 * 24 * 60 * 60 * 1000,
        );
        break;
      case PeriodTypeEnum.YEAR:
        calculatedStartDate = new Date(
          now.getTime() - 365 * 24 * 60 * 60 * 1000,
        );
        break;
      case PeriodTypeEnum.MONTH:
      default:
        calculatedStartDate = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );
        break;
    }

    return { startDate: calculatedStartDate, endDate: calculatedEndDate };
  }

  private generatePredictions(
    generalMetrics: any,
    trendData: any[],
    activePlans: any[],
  ) {
    if (!generalMetrics || trendData.length === 0) {
      return {
        fechaFinalizacionEstimada: new Date().toISOString().split('T')[0],
        paginasRestantes: 0,
        diasRestantesEstimados: 0,
        probabilidadCumplimiento: 0,
        recomendacionAjuste: 'Datos insuficientes para generar predicciones',
      };
    }

    const recentData = trendData.slice(-7);
    const avgPagesPerDay =
      recentData.length > 0
        ? recentData.reduce((sum, day) => sum + day.paginasLeidas, 0) /
          recentData.length
        : 0;

    const totalPagesRemaining = activePlans.reduce((sum, plan) => {
      return sum + Math.max(0, (100 - plan.progreso) * 2);
    }, 0);

    const daysToComplete =
      avgPagesPerDay > 0 ? Math.ceil(totalPagesRemaining / avgPagesPerDay) : 0;
    const estimatedEndDate = new Date();
    estimatedEndDate.setDate(estimatedEndDate.getDate() + daysToComplete);

    const consistency = generalMetrics.consistencia || 0;
    const probability = Math.min(100, Math.max(0, consistency * 1.2)); // Factor de ajuste

    let recommendation = 'Mantén tu ritmo actual';
    if (avgPagesPerDay < 15) {
      recommendation = 'Considera aumentar 5-10 páginas por día';
    } else if (avgPagesPerDay > 30) {
      recommendation =
        'Excelente ritmo, podrías reducir un poco si es necesario';
    }

    return {
      fechaFinalizacionEstimada: estimatedEndDate.toISOString().split('T')[0],
      paginasRestantes: totalPagesRemaining,
      diasRestantesEstimados: daysToComplete,
      probabilidadCumplimiento: Math.round(probability * 100) / 100,
      recomendacionAjuste: recommendation,
    };
  }

  // Generar alertas y recomendaciones
  private generateAlertsAndRecommendations(
    generalMetrics: any,
    consistencyAnalysis: any,
    speedAnalysis: any,
    activePlans: any[],
  ) {
    const alertas: any[] = [];
    const recomendaciones: any[] = [];
    const logros: any[] = [];

    // Generar alertas
    if (consistencyAnalysis?.diasSinLeer > 2) {
      alertas.push({
        tipo: 'CONSISTENCIA',
        severidad: 'ALTA',
        mensaje: `Llevas ${consistencyAnalysis.diasSinLeer} días sin leer`,
        accionRecomendada: 'Retoma tu rutina de lectura hoy mismo',
      });
    }

    const delayedPlans = activePlans.filter((plan) => plan.atrasado);
    if (delayedPlans.length > 0) {
      alertas.push({
        tipo: 'ATRASO',
        severidad: 'MEDIA',
        mensaje: `Tienes ${delayedPlans.length} plan(es) con atraso`,
        accionRecomendada: 'Revisa y ajusta tus planes de lectura',
      });
    }

    if (speedAnalysis?.tendenciaVelocidad === 'DISMINUYENDO') {
      alertas.push({
        tipo: 'VELOCIDAD',
        severidad: 'BAJA',
        mensaje: 'Tu velocidad de lectura ha disminuido',
        accionRecomendada: 'Considera técnicas de lectura rápida',
      });
    }

    if (generalMetrics?.promedioTiempoDiario < 30) {
      recomendaciones.push({
        categoria: 'HABITOS',
        titulo: 'Aumentar tiempo de lectura',
        descripcion:
          'Tu promedio diario es bajo, considera aumentar 15 minutos más',
        impactoEstimado: 'Aumento del 50% en progreso',
      });
    }

    if (consistencyAnalysis?.porcentajeConsistencia < 70) {
      recomendaciones.push({
        categoria: 'HORARIO',
        titulo: 'Mejorar consistencia',
        descripcion: 'Establece un horario fijo para leer todos los días',
        impactoEstimado: 'Mejora del 30% en cumplimiento de metas',
      });
    }

    // Generar logros
    if (consistencyAnalysis?.rachaActual >= 7) {
      logros.push({
        tipo: 'RACHA',
        titulo: `🔥 ¡Racha de ${consistencyAnalysis.rachaActual} días!`,
        descripcion: 'Has mantenido una excelente consistencia',
        fechaLogro: new Date().toISOString().split('T')[0],
      });
    }

    if (
      speedAnalysis?.velocidadActual >
      speedAnalysis?.velocidadPromedio * 1.2
    ) {
      logros.push({
        tipo: 'VELOCIDAD',
        titulo: '⚡ ¡Velocidad mejorada!',
        descripcion: 'Tu velocidad de lectura ha aumentado significativamente',
        fechaLogro: new Date().toISOString().split('T')[0],
      });
    }

    return { alertas, recomendaciones, logros };
  }

  // Generar alertas rápidas
  private generateQuickAlerts(todayMetrics: any, consistencyData: any): any[] {
    const alertas: any[] = [];

    if (!todayMetrics || todayMetrics.totalPaginasLeidas === 0) {
      alertas.push({
        tipo: 'RECORDATORIO',
        mensaje: 'Aún no has registrado lectura hoy',
      });
    }

    if (consistencyData?.diasSinLeer > 1) {
      alertas.push({
        tipo: 'CONSISTENCIA',
        mensaje: `Llevas ${consistencyData.diasSinLeer} días sin leer`,
      });
    }

    return alertas;
  }
}
