import { DatabaseService } from 'src/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanStatusEnum } from './dto/plan-status.dto';
import { DailyProgressDto, UpdateProgressDto, DayStatusEnum } from './dto/progress-tracking.dto';

@Injectable()
export class PlanRepository {
  private readonly logger = new Logger(PlanRepository.name);

  constructor(private readonly prisma: DatabaseService) {}

  async createPlan(userId: number, bookId: number, endDate: Date, profileId: number) {
    try {
      this.logger.log(`Creando plan de lectura para usuario ${userId}, libro ${bookId}, perfil ${profileId}`);

      const newPlan = await this.prisma.readingPlan.create({
        data: {
          id: userId,
          id_libro: bookId,
          id_perfil: profileId,
          fecha_inicio: new Date(),
          fecha_fin: endDate,
          fecha_fin_original: endDate,
          titulo: 'Plan de Lectura',
          estado: 'ACTIVO',
          progreso_porcentaje: 0.0,
          dias_atrasado: 0,
        },
      });

      this.logger.log(`Plan de lectura creado exitosamente con ID: ${newPlan.id_plan}`);
      return newPlan;
    } catch (error) {
      this.logger.error(`Error al crear plan de lectura: ${error.message}`, error.stack);
      return undefined;
    }
  }

  async createPlanDetail(params: {
    id_plan: number;
    id_capitulo: number;
    fecha_asignada: Date;
    tiempo_estimado_minutos: number;
    pagina_inicio: number;
    pagina_fin: number;
    day: number;
  }) {
    try {
      const planDetail = await this.prisma.planDetail.create({
        data: {
          id_plan: params.id_plan,
          id_capitulo: params.id_capitulo,
          fecha_asignada: params.fecha_asignada,
          tiempo_estimado_minutos: params.tiempo_estimado_minutos,
          pagina_inicio: params.pagina_inicio,
          pagina_fin: params.pagina_fin,
          dia: params.day,
          leido: false,
          es_atrasado: false,
        },
      });

      return planDetail;
    } catch (error) {
      this.logger.error(`Error al crear detalle del plan: ${error.message}`, error.stack);
      throw error; // Re-lanzar para que el servicio pueda manejarlo
    }
  }

  // Obtener planes de un usuario
  async findUserPlans(userId: number) {
    try {
      this.logger.log(`Obteniendo planes para usuario ${userId}`);

      const plans = await this.prisma.readingPlan.findMany({
        where: {
          id: userId,
        },
        include: {
          libro: {
            select: {
              id_libro: true,
              titulo: true,
              autor: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      this.logger.log(`${plans.length} planes encontrados para usuario ${userId}`);
      return plans;
    } catch (error) {
      this.logger.error(`Error al obtener planes del usuario: ${error.message}`, error.stack);
      return undefined;
    }
  }

  // Obtener plan específico con detalles
  async findPlanWithDetails(planId: number) {
    try {
      this.logger.log(`Obteniendo plan ${planId} con detalles`);

      const plan = await this.prisma.readingPlan.findUnique({
        where: {
          id_plan: planId,
        },
        include: {
          libro: {
            select: {
              id_libro: true,
              titulo: true,
              autor: true,
            },
          },
          detalleplanlectura: {
            include: {
              capitulo: {
                select: {
                  id_capitulo: true,
                  numero_capitulo: true,
                  titulo_capitulo: true,
                  paginas_estimadas: true,
                },
              },
            },
            orderBy: {
              fecha_asignada: 'asc',
            },
          },
          progresolectura: {
            orderBy: {
              fecha: 'asc',
            },
          },
        },
      });

      if (plan) {
        this.logger.log(`Plan ${planId} encontrado con ${plan.detalleplanlectura.length} detalles`);
      } else {
        this.logger.warn(`Plan ${planId} no encontrado`);
      }

      return plan;
    } catch (error) {
      this.logger.error(`Error al obtener plan con detalles: ${error.message}`, error.stack);
      return undefined;
    }
  }

  // Actualizar plan
  async updatePlan(planId: number, updateData: UpdatePlanDto) {
    try {
      this.logger.log(`Actualizando plan ${planId}`);

      // Mapear campos usando función auxiliar
      const mappedData = this.mapUpdateDataToDbFields(updateData);

      const updatedPlan = await this.prisma.readingPlan.update({
        where: {
          id_plan: planId,
        },
        data: mappedData,
        include: {
          libro: {
            select: {
              id_libro: true,
              titulo: true,
              autor: true,
            },
          },
        },
      });

      this.logger.log(`Plan ${planId} actualizado exitosamente`);
      return updatedPlan;
    } catch (error) {
      this.logger.error(`Error al actualizar plan: ${error.message}`, error.stack);
      return undefined;
    }
  }

  // Función auxiliar para mapear campos de DTO a campos de base de datos
  private mapUpdateDataToDbFields(updateData: UpdatePlanDto): any {
    const mappedData: any = {
      updated_at: new Date(),
    };

    // Mapear solo los campos que están presentes en updateData
    if (updateData.titulo !== undefined) {
      mappedData.titulo = updateData.titulo;
    }

    if (updateData.descripcion !== undefined) {
      mappedData.descripcion = updateData.descripcion;
    }

    if (updateData.fechaFin !== undefined) {
      mappedData.fecha_fin = updateData.fechaFin;
    }

    if (updateData.incluirFinesSemana !== undefined) {
      mappedData.incluir_fines_semana = updateData.incluirFinesSemana;
    }

    if (updateData.paginasPorDia !== undefined) {
      mappedData.paginas_por_dia = updateData.paginasPorDia;
    }

    if (updateData.tiempoEstimadoDia !== undefined) {
      mappedData.tiempo_estimado_dia = updateData.tiempoEstimadoDia;
    }

    return mappedData;
  }

  // Cambiar estado del plan
  async updatePlanStatus(planId: number, status: PlanStatusEnum) {
    try {
      this.logger.log(`Cambiando estado del plan ${planId} a ${status}`);

      const updatedPlan = await this.prisma.readingPlan.update({
        where: {
          id_plan: planId,
        },
        data: {
          estado: status,
          updated_at: new Date(),
        },
      });

      this.logger.log(`Estado del plan ${planId} cambiado a ${status}`);
      return updatedPlan;
    } catch (error) {
      this.logger.error(`Error al cambiar estado del plan: ${error.message}`, error.stack);
      return undefined;
    }
  }

  // Eliminar plan
  async deletePlan(planId: number) {
    try {
      this.logger.log(`Eliminando plan ${planId}`);

      // Prisma manejará las eliminaciones en cascada según el schema
      const deletedPlan = await this.prisma.readingPlan.delete({
        where: {
          id_plan: planId,
        },
      });

      this.logger.log(`Plan ${planId} eliminado exitosamente`);
      return deletedPlan;
    } catch (error) {
      this.logger.error(`Error al eliminar plan: ${error.message}`, error.stack);
      return undefined;
    }
  }

  // Verificar si el plan pertenece al usuario
  async verifyPlanOwnership(planId: number, userId: number): Promise<boolean> {
    try {
      const plan = await this.prisma.readingPlan.findFirst({
        where: {
          id_plan: planId,
          id: userId,
        },
      });

      return !!plan;
    } catch (error) {
      this.logger.error(`Error al verificar propiedad del plan: ${error.message}`, error.stack);
      return false;
    }
  }

  // ==================== MÉTODOS DE TRACKING DE PROGRESO ====================

  // Crear o actualizar progreso diario
  async createOrUpdateDailyProgress(progressData: DailyProgressDto) {
    try {
      this.logger.log(`Registrando progreso para plan ${progressData.planId} en fecha ${progressData.fecha}`);

      // Verificar si ya existe progreso para esta fecha
      const existingProgress = await this.prisma.readingProgress.findFirst({
        where: {
          id_plan: progressData.planId,
          fecha: progressData.fecha,
        },
      });

      const mappedData = this.mapProgressDataToDbFields(progressData);

      if (existingProgress) {
        // Actualizar progreso existente
        const updatedProgress = await this.prisma.readingProgress.update({
          where: {
            id_progreso: existingProgress.id_progreso,
          },
          data: mappedData,
        });

        this.logger.log(`Progreso actualizado para plan ${progressData.planId}`);
        return updatedProgress;
      } else {
        // Crear nuevo progreso
        const newProgress = await this.prisma.readingProgress.create({
          data: {
            id_plan: progressData.planId,
            ...mappedData,
          },
        });

        this.logger.log(`Nuevo progreso creado para plan ${progressData.planId}`);
        return newProgress;
      }
    } catch (error) {
      this.logger.error(`Error al registrar progreso: ${error.message}`, error.stack);
      return undefined;
    }
  }

  // Obtener historial de progreso de un plan
  async getProgressHistory(planId: number, limit?: number) {
    try {
      this.logger.log(`Obteniendo historial de progreso para plan ${planId}`);

      const progress = await this.prisma.readingProgress.findMany({
        where: {
          id_plan: planId,
        },
        orderBy: {
          fecha: 'desc',
        },
        take: limit,
      });

      this.logger.log(`${progress.length} registros de progreso encontrados para plan ${planId}`);
      return progress;
    } catch (error) {
      this.logger.error(`Error al obtener historial de progreso: ${error.message}`, error.stack);
      return undefined;
    }
  }

  // Actualizar progreso específico
  async updateProgress(progressId: number, updateData: UpdateProgressDto) {
    try {
      this.logger.log(`Actualizando progreso ${progressId}`);

      const mappedData = this.mapUpdateProgressToDbFields(updateData);

      const updatedProgress = await this.prisma.readingProgress.update({
        where: {
          id_progreso: progressId,
        },
        data: mappedData,
      });

      this.logger.log(`Progreso ${progressId} actualizado exitosamente`);
      return updatedProgress;
    } catch (error) {
      this.logger.error(`Error al actualizar progreso: ${error.message}`, error.stack);
      return undefined;
    }
  }

  // Marcar detalles del plan como leídos
  async markChaptersAsRead(detailIds: number[], tiempoReal?: number, dificultad?: number, notas?: string) {
    try {
      this.logger.log(`Marcando ${detailIds.length} detalles como leídos`);

      const updateData: any = {
        leido: true,
        fecha_completado: new Date(),
        updated_at: new Date(),
      };

      if (tiempoReal !== undefined) {
        updateData.tiempo_real_minutos = tiempoReal;
      }

      if (dificultad !== undefined) {
        updateData.dificultad_percibida = dificultad;
      }

      if (notas !== undefined) {
        updateData.notas = notas;
      }

      const updatedDetails = await this.prisma.planDetail.updateMany({
        where: {
          id_detalle: {
            in: detailIds,
          },
        },
        data: updateData,
      });

      this.logger.log(`${updatedDetails.count} detalles marcados como leídos`);
      return updatedDetails;
    } catch (error) {
      this.logger.error(`Error al marcar capítulos como leídos: ${error.message}`, error.stack);
      return undefined;
    }
  }

  // Obtener detalles del plan por fecha
  async getPlanDetailsByDate(planId: number, fecha: Date) {
    try {
      const details = await this.prisma.planDetail.findMany({
        where: {
          id_plan: planId,
          fecha_asignada: fecha,
        },
        include: {
          capitulo: {
            select: {
              id_capitulo: true,
              numero_capitulo: true,
              titulo_capitulo: true,
              paginas_estimadas: true,
            },
          },
        },
        orderBy: {
          dia: 'asc',
        },
      });

      return details;
    } catch (error) {
      this.logger.error(`Error al obtener detalles por fecha: ${error.message}`, error.stack);
      return undefined;
    }
  }

  // Calcular estadísticas de progreso
  async calculateProgressStats(planId: number) {
    try {
      const [plan, allProgress, allDetails] = await Promise.all([
        this.prisma.readingPlan.findUnique({
          where: { id_plan: planId },
        }),
        this.prisma.readingProgress.findMany({
          where: { id_plan: planId },
          orderBy: { fecha: 'asc' },
        }),
        this.prisma.planDetail.findMany({
          where: { id_plan: planId },
          orderBy: { fecha_asignada: 'asc' },
        }),
      ]);

      if (!plan) return null;

      // Calcular estadísticas básicas
      const totalDetails = allDetails.length;
      const completedDetails = allDetails.filter(d => d.leido).length;
      const progressPercentage = totalDetails > 0 ? (completedDetails / totalDetails) * 100 : 0;

      // Calcular estadísticas de progreso diario
      const completedDays = allProgress.filter(p => p.completado).length;
      const totalDays = allProgress.length;

      const avgTimePerDay = allProgress.length > 0
        ? allProgress.reduce((sum, p) => sum + (p.tiempo_invertido_min || 0), 0) / allProgress.length
        : 0;

      const avgPagesPerDay = allProgress.length > 0
        ? allProgress.reduce((sum, p) => sum + (p.paginas_leidas || 0), 0) / allProgress.length
        : 0;

      // Calcular racha actual
      let currentStreak = 0;
      for (let i = allProgress.length - 1; i >= 0; i--) {
        if (allProgress[i].completado) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        totalDetails,
        completedDetails,
        progressPercentage,
        completedDays,
        totalDays,
        avgTimePerDay,
        avgPagesPerDay,
        currentStreak,
      };
    } catch (error) {
      this.logger.error(`Error al calcular estadísticas: ${error.message}`, error.stack);
      return null;
    }
  }

  // ==================== FUNCIONES AUXILIARES DE MAPEO ====================

  // Mapear datos de progreso diario a campos de base de datos
  private mapProgressDataToDbFields(progressData: DailyProgressDto): any {
    const mappedData: any = {
      fecha: progressData.fecha,
      updated_at: new Date(),
    };

    if (progressData.capitulosLeidos !== undefined) {
      mappedData.capitulos_leidos = progressData.capitulosLeidos.length;
    }

    if (progressData.paginasLeidas !== undefined) {
      mappedData.paginas_leidas = progressData.paginasLeidas;
    }

    if (progressData.tiempoInvertidoMin !== undefined) {
      mappedData.tiempo_invertido_min = progressData.tiempoInvertidoMin;
    }

    if (progressData.estadoDia !== undefined) {
      mappedData.estado_dia = progressData.estadoDia;
      mappedData.completado = progressData.estadoDia === 'COMPLETADO';
    }

    if (progressData.porcentajeDia !== undefined) {
      mappedData.porcentaje_dia = progressData.porcentajeDia;
    }

    if (progressData.notasDia !== undefined) {
      mappedData.notas_dia = progressData.notasDia;
    }

    return mappedData;
  }

  // Mapear datos de actualización de progreso a campos de base de datos
  private mapUpdateProgressToDbFields(updateData: UpdateProgressDto): any {
    const mappedData: any = {
      updated_at: new Date(),
    };

    if (updateData.paginasLeidas !== undefined) {
      mappedData.paginas_leidas = updateData.paginasLeidas;
    }

    if (updateData.tiempoInvertidoMin !== undefined) {
      mappedData.tiempo_invertido_min = updateData.tiempoInvertidoMin;
    }

    if (updateData.estadoDia !== undefined) {
      mappedData.estado_dia = updateData.estadoDia;
      mappedData.completado = updateData.estadoDia === 'COMPLETADO';
    }

    if (updateData.porcentajeDia !== undefined) {
      mappedData.porcentaje_dia = updateData.porcentajeDia;
    }

    if (updateData.notasDia !== undefined) {
      mappedData.notas_dia = updateData.notasDia;
    }

    return mappedData;
  }
}
