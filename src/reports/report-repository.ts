import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { DashboardFiltersDto, PeriodTypeEnum } from './dto';

@Injectable()
export class ReportRepository {
  private readonly logger = new Logger(ReportRepository.name);

  constructor(private readonly prisma: DatabaseService) {}

  async getUserGeneralMetrics(userId: number, startDate: Date, endDate: Date) {
    try {
      this.logger.log(`Obteniendo métricas generales para usuario ${userId}`);

      const [
        totalProgress,
        completedPlans,
        activePlans,
        totalPages,
        totalTime,
        readingSpeed,
      ] = await Promise.all([
        this.prisma.readingProgress.findMany({
          where: {
            planlectura: { id: userId },
            fecha: { gte: startDate, lte: endDate },
          },
        }),

        this.prisma.readingPlan.count({
          where: {
            id: userId,
            estado: 'COMPLETADO',
            fecha_fin: { gte: startDate, lte: endDate },
          },
        }),

        this.prisma.readingPlan.count({
          where: {
            id: userId,
            estado: 'ACTIVO',
          },
        }),

        this.prisma.readingProgress.aggregate({
          where: {
            planlectura: { id: userId },
            fecha: { gte: startDate, lte: endDate },
          },
          _sum: { paginas_leidas: true },
        }),

        this.prisma.readingProgress.aggregate({
          where: {
            planlectura: { id: userId },
            fecha: { gte: startDate, lte: endDate },
          },
          _sum: { tiempo_invertido_min: true },
        }),

        this.prisma.readingProgress.aggregate({
          where: {
            planlectura: { id: userId },
            fecha: { gte: startDate, lte: endDate },
            tiempo_invertido_min: { gt: 0 },
            paginas_leidas: { gt: 0 },
          },
          _avg: { paginas_leidas: true, tiempo_invertido_min: true },
        }),
      ]);

      const totalDays = totalProgress.length;
      const completedDays = totalProgress.filter((p) => p.completado).length;
      const avgPagesPerDay = totalPages._sum.paginas_leidas || 0;
      const avgTimePerDay = totalTime._sum.tiempo_invertido_min || 0;

      const avgReadingSpeed =
        readingSpeed._avg.paginas_leidas &&
        readingSpeed._avg.tiempo_invertido_min
          ? (readingSpeed._avg.paginas_leidas /
              readingSpeed._avg.tiempo_invertido_min) *
            60
          : 0;

      return {
        totalLibrosLeidos: completedPlans,
        totalPaginasLeidas: totalPages._sum.paginas_leidas || 0,
        totalTiempoInvertido: totalTime._sum.tiempo_invertido_min || 0,
        promedioTiempoDiario: totalDays > 0 ? avgTimePerDay / totalDays : 0,
        velocidadLecturaPromedio: avgReadingSpeed,
        librosEnProgreso: activePlans,
        planesActivos: activePlans,
        diasCompletados: completedDays,
        totalDias: totalDays,
        consistencia: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener métricas generales: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  async getDailyTrendData(userId: number, startDate: Date, endDate: Date) {
    try {
      this.logger.log(`Obteniendo datos de tendencia para usuario ${userId}`);

      const dailyProgress = await this.prisma.readingProgress.findMany({
        where: {
          planlectura: { id: userId },
          fecha: { gte: startDate, lte: endDate },
        },
        orderBy: { fecha: 'asc' },
        select: {
          fecha: true,
          paginas_leidas: true,
          tiempo_invertido_min: true,
          completado: true,
        },
      });

      return dailyProgress.map((progress) => ({
        fecha: progress.fecha.toISOString().split('T')[0],
        paginasLeidas: progress.paginas_leidas || 0,
        tiempoInvertido: progress.tiempo_invertido_min || 0,
        velocidadLectura:
          progress.tiempo_invertido_min && progress.tiempo_invertido_min > 0
            ? ((progress.paginas_leidas || 0) / progress.tiempo_invertido_min) *
              60
            : 0,
        completado: progress.completado,
      }));
    } catch (error) {
      this.logger.error(
        `Error al obtener datos de tendencia: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async getWeeklyPatterns(userId: number, startDate: Date, endDate: Date) {
    try {
      this.logger.log(`Analizando patrones semanales para usuario ${userId}`);

      const weeklyData = await this.prisma.$queryRaw`
        SELECT
          EXTRACT(DOW FROM fecha) as day_of_week,
          AVG(paginas_leidas) as avg_pages,
          AVG(tiempo_invertido_min) as avg_time,
          COUNT(*) as total_days,
          SUM(CASE WHEN completado THEN 1 ELSE 0 END) as completed_days
        FROM "books"."ReadingProgress" rp
        JOIN "books"."ReadingPlan" pl ON rp.id_plan = pl.id_plan
        WHERE pl.id = ${userId}
          AND rp.fecha >= ${startDate}
          AND rp.fecha <= ${endDate}
        GROUP BY EXTRACT(DOW FROM fecha)
        ORDER BY day_of_week
      `;

      const dayNames = [
        'Domingo',
        'Lunes',
        'Martes',
        'Miércoles',
        'Jueves',
        'Viernes',
        'Sábado',
      ];

      const weeklyStats = (weeklyData as any[]).map((day) => ({
        dayName: dayNames[day.day_of_week],
        avgPages: parseFloat(day.avg_pages) || 0,
        avgTime: parseFloat(day.avg_time) || 0,
        consistency:
          day.total_days > 0 ? (day.completed_days / day.total_days) * 100 : 0,
      }));

      const bestDay = weeklyStats.reduce((best, current) =>
        current.avgPages > best.avgPages ? current : best,
      );
      const worstDay = weeklyStats.reduce((worst, current) =>
        current.avgPages < worst.avgPages ? current : worst,
      );

      const weekendDays = weeklyStats.filter(
        (_, index) => index === 0 || index === 6,
      );
      const weekDays = weeklyStats.filter((_, index) => index > 0 && index < 6);

      const avgWeekend =
        weekendDays.length > 0
          ? weekendDays.reduce((sum, day) => sum + day.avgPages, 0) /
            weekendDays.length
          : 0;
      const avgWeekdays =
        weekDays.length > 0
          ? weekDays.reduce((sum, day) => sum + day.avgPages, 0) /
            weekDays.length
          : 0;

      const overallConsistency =
        weeklyStats.length > 0
          ? weeklyStats.reduce((sum, day) => sum + day.consistency, 0) /
            weeklyStats.length
          : 0;

      return {
        mejorDiaSemana: bestDay?.dayName || 'N/A',
        peorDiaSemana: worstDay?.dayName || 'N/A',
        promedioFinesSemana: avgWeekend,
        promedioEntresemana: avgWeekdays,
        consistenciaGeneral: overallConsistency,
        detallesSemana: weeklyStats,
      };
    } catch (error) {
      this.logger.error(
        `Error al analizar patrones semanales: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  // Obtener planes activos con detalles
  async getActivePlansWithDetails(userId: number) {
    try {
      this.logger.log(`Obteniendo planes activos para usuario ${userId}`);

      const activePlans = await this.prisma.readingPlan.findMany({
        where: {
          id: userId,
          estado: 'ACTIVO',
        },
        include: {
          libro: {
            select: {
              titulo: true,
              autor: true,
            },
          },
          detalleplanlectura: {
            select: {
              leido: true,
              fecha_asignada: true,
            },
          },
        },
      });

      return activePlans.map((plan) => {
        const totalDetails = plan.detalleplanlectura.length;
        const completedDetails = plan.detalleplanlectura.filter(
          (d) => d.leido,
        ).length;
        const progress =
          totalDetails > 0 ? (completedDetails / totalDetails) * 100 : 0;

        // Calcular días restantes
        const now = new Date();
        const endDate = new Date(plan.fecha_fin);
        const daysRemaining = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 3600 * 24),
        );

        // Verificar si está atrasado
        const scheduledDetails = plan.detalleplanlectura.filter(
          (d) => new Date(d.fecha_asignada) <= now && !d.leido,
        );
        const isDelayed = scheduledDetails.length > 0;

        return {
          id_plan: plan.id_plan,
          titulo: plan.titulo,
          libro: plan.libro?.titulo || 'Sin título',
          progreso: Math.round(progress * 100) / 100,
          estado: plan.estado,
          diasRestantes: Math.max(0, daysRemaining),
          atrasado: isDelayed,
        };
      });
    } catch (error) {
      this.logger.error(
        `Error al obtener planes activos: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  // Obtener análisis de velocidad de lectura
  async getReadingSpeedAnalysis(
    userId: number,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      this.logger.log(`Analizando velocidad de lectura para usuario ${userId}`);

      const speedData = await this.prisma.readingProgress.findMany({
        where: {
          planlectura: { id: userId },
          fecha: { gte: startDate, lte: endDate },
          tiempo_invertido_min: { gt: 0 },
          paginas_leidas: { gt: 0 },
        },
        select: {
          fecha: true,
          paginas_leidas: true,
          tiempo_invertido_min: true,
        },
        orderBy: { fecha: 'asc' },
      });

      if (speedData.length === 0) {
        return null;
      }

      // Calcular velocidades diarias (páginas por hora)
      const dailySpeeds = speedData.map((day) => ({
        fecha: day.fecha,
        velocidad:
          ((day.paginas_leidas || 0) / (day.tiempo_invertido_min || 1)) * 60,
      }));

      const speeds = dailySpeeds.map((d) => d.velocidad);
      const currentSpeed = speeds[speeds.length - 1] || 0;
      const averageSpeed =
        speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
      const maxSpeed = Math.max(...speeds);
      const minSpeed = Math.min(...speeds);

      // Determinar tendencia (comparar últimos 7 días con anteriores)
      const recentSpeeds = speeds.slice(-7);
      const previousSpeeds = speeds.slice(-14, -7);

      let trend: 'MEJORANDO' | 'ESTABLE' | 'DISMINUYENDO' = 'ESTABLE';
      if (recentSpeeds.length > 0 && previousSpeeds.length > 0) {
        const recentAvg =
          recentSpeeds.reduce((sum, s) => sum + s, 0) / recentSpeeds.length;
        const previousAvg =
          previousSpeeds.reduce((sum, s) => sum + s, 0) / previousSpeeds.length;

        if (recentAvg > previousAvg * 1.05) trend = 'MEJORANDO';
        else if (recentAvg < previousAvg * 0.95) trend = 'DISMINUYENDO';
      }

      return {
        velocidadActual: Math.round(currentSpeed * 100) / 100,
        velocidadPromedio: Math.round(averageSpeed * 100) / 100,
        velocidadMaxima: Math.round(maxSpeed * 100) / 100,
        velocidadMinima: Math.round(minSpeed * 100) / 100,
        tendenciaVelocidad: trend,
        factoresInfluencia: ['Hora del día', 'Tipo de contenido'], // Esto se puede expandir
        datosVelocidad: dailySpeeds,
      };
    } catch (error) {
      this.logger.error(
        `Error al analizar velocidad de lectura: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  // Obtener análisis de consistencia
  async getConsistencyAnalysis(userId: number, startDate: Date, endDate: Date) {
    try {
      this.logger.log(`Analizando consistencia para usuario ${userId}`);

      const progressData = await this.prisma.readingProgress.findMany({
        where: {
          planlectura: { id: userId },
          fecha: { gte: startDate, lte: endDate },
        },
        orderBy: { fecha: 'asc' },
        select: {
          fecha: true,
          completado: true,
        },
      });

      const totalDays = progressData.length;
      const completedDays = progressData.filter((p) => p.completado).length;
      const consistencyPercentage =
        totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

      // Calcular racha actual
      let currentStreak = 0;
      for (let i = progressData.length - 1; i >= 0; i--) {
        if (progressData[i].completado) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calcular mejor racha
      let bestStreak = 0;
      let tempStreak = 0;
      for (const progress of progressData) {
        if (progress.completado) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      // Calcular días sin leer consecutivos
      let daysWithoutReading = 0;
      for (let i = progressData.length - 1; i >= 0; i--) {
        if (!progressData[i].completado) {
          daysWithoutReading++;
        } else {
          break;
        }
      }

      return {
        diasCompletados: completedDays,
        diasTotales: totalDays,
        porcentajeConsistencia: Math.round(consistencyPercentage * 100) / 100,
        rachaActual: currentStreak,
        mejorRacha: bestStreak,
        diasSinLeer: daysWithoutReading,
      };
    } catch (error) {
      this.logger.error(
        `Error al analizar consistencia: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  // Obtener tareas del día
  async getTodayTasks(userId: number) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTasks = await this.prisma.planDetail.findMany({
        where: {
          planlectura: { id: userId },
          fecha_asignada: { gte: today, lt: tomorrow },
          leido: false,
        },
        include: {
          planlectura: {
            include: {
              libro: {
                select: {
                  titulo: true,
                },
              },
            },
          },
          capitulo: {
            select: {
              titulo_capitulo: true,
            },
          },
        },
      });

      return todayTasks.map((task) => ({
        planId: task.id_plan || 0,
        libro: task.planlectura?.libro?.titulo || 'Sin título',
        capitulo:
          task.capitulo?.titulo_capitulo ||
          `Páginas ${task.pagina_inicio}-${task.pagina_fin}`,
        paginasEstimadas:
          (task.pagina_fin || 0) - (task.pagina_inicio || 0) + 1,
        tiempoEstimado: 30, // Tiempo estimado por defecto, se puede calcular después
      }));
    } catch (error) {
      this.logger.error(
        `Error al obtener tareas del día: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
