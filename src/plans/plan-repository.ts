import { DatabaseService } from 'src/database/database.service';
import { Injectable, Logger } from '@nestjs/common';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanStatusEnum } from './dto/plan-status.dto';

@Injectable()
export class PlanRepository {
  private readonly logger = new Logger(PlanRepository.name);

  constructor(private readonly prisma: DatabaseService) {}

  async createPlan(userId: number, bookId: number, endDate: Date) {
    try {
      this.logger.log(`Creando plan de lectura para usuario ${userId}, libro ${bookId}`);

      const newPlan = await this.prisma.readingPlan.create({
        data: {
          id: userId,
          id_libro: bookId,
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
}
