import { DatabaseService } from 'src/database/database.service';
import { Injectable, Logger } from '@nestjs/common';

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
}
