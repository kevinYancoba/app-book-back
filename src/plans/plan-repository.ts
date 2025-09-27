import { DatabaseService } from 'src/database/database.service';

export class PlanRepository {
  constructor(private readonly prisma: DatabaseService) {}

  async createPlan(userId: number, bookId: number, endDate: Date) {
    try {
      const newPlan = await this.prisma.readingPlan.create({
        data: {
          id: userId,
          id_libro: bookId,
          fecha_inicio: new Date(),
          fecha_fin: endDate,
        },
      });

      if (!newPlan) return undefined;

      return newPlan;
    } catch (error) {
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
    day : number;
  }) {
    return this.prisma.planDetail.create({
      data: {
        id_plan: params.id_plan,
        id_capitulo: params.id_capitulo,
        fecha_asignada: params.fecha_asignada,
        tiempo_estimado_minutos: params.tiempo_estimado_minutos,
        pagina_inicio: params.pagina_inicio,
        pagina_fin: params.pagina_fin,
        dia : params.day
      },
    });
  }




}
