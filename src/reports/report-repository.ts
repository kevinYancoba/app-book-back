import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ReportRepository {
  private readonly logger = new Logger(ReportRepository.name);

  constructor(private readonly prisma: DatabaseService) {}

  async getUserOverview(userId: number) {
    try {
      this.logger.log(`Obteniendo panorama general para usuario ${userId}`);

      const overview = await this.prisma.$queryRaw`
        WITH perfil_usuario AS (
          SELECT
            p.nivel_lectura,
            p.tiempo_lectura_diario,
            p.hora_preferida,
            p.incluir_fines_de_semana,
            p.auto_ajuste_plan
          FROM "books"."perfillectura" p
          WHERE p.user_id = ${userId}
          LIMIT 1
        ),
        resumen_libros AS (
          SELECT
            COUNT(DISTINCT l.id_libro) as total_libros,
            COUNT(DISTINCT CASE WHEN pl.estado = 'ACTIVO' THEN l.id_libro END) as libros_en_progreso,
            COUNT(DISTINCT CASE WHEN pl.estado = 'COMPLETADO' THEN l.id_libro END) as libros_completados,
            COUNT(pl.id_plan) as total_planes,
            COUNT(CASE WHEN pl.estado = 'ACTIVO' THEN 1 END) as planes_activos,
            COUNT(CASE WHEN pl.estado = 'COMPLETADO' THEN 1 END) as planes_completados,
            COUNT(CASE WHEN pl.estado = 'PAUSADO' THEN 1 END) as planes_pausados
          FROM "books"."planlectura" pl
          LEFT JOIN "books"."libro" l ON pl.id_libro = l.id_libro
          WHERE pl.id = ${userId}
        ),
        estadisticas_progreso AS (
          SELECT
            COUNT(d.id_detalle) as total_capitulos,
            COUNT(CASE WHEN d.leido = true THEN 1 END) as capitulos_leidos,
            COUNT(CASE WHEN d.leido = false OR d.leido IS NULL THEN 1 END) as capitulos_pendientes,
            COALESCE(
              ROUND(
                (COUNT(CASE WHEN d.leido = true THEN 1 END)::numeric /
                 NULLIF(COUNT(d.id_detalle), 0)) * 100, 2
              ), 0
            ) as porcentaje_progreso,
            COALESCE(SUM(CASE WHEN d.leido = true THEN c.paginas_estimadas END), 0) as paginas_leidas,
            COALESCE(SUM(d.tiempo_real_minutos), 0) as tiempo_total_invertido
          FROM "books"."planlectura" pl
          LEFT JOIN "books"."detalleplanlectura" d ON pl.id_plan = d.id_plan
          LEFT JOIN "books"."capitulo" c ON d.id_capitulo = c.id_capitulo
          WHERE pl.id = ${userId}
        ),
        analisis_cumplimiento AS (
          SELECT
            COUNT(d.id_detalle) as dias_planificados,
            COUNT(CASE WHEN d.leido = true THEN 1 END) as dias_completados,
            COUNT(CASE WHEN d.leido = false AND d.fecha_asignada < CURRENT_DATE THEN 1 END) as dias_atrasados,
            COUNT(CASE WHEN d.leido = true AND d.fecha_completado < d.fecha_asignada THEN 1 END) as dias_adelantados,
            COALESCE(
              ROUND(
                (COUNT(CASE WHEN d.leido = true THEN 1 END)::numeric /
                 NULLIF(COUNT(d.id_detalle), 0)) * 100, 2
              ), 0
            ) as porcentaje_cumplimiento
          FROM "books"."planlectura" pl
          LEFT JOIN "books"."detalleplanlectura" d ON pl.id_plan = d.id_plan
          WHERE pl.id = ${userId}
        )
        SELECT
          pu.*,
          rl.*,
          ep.*,
          ac.*,
          CASE
            WHEN ac.dias_adelantados > ac.dias_atrasados THEN 'POSITIVA'
            WHEN ac.dias_atrasados > ac.dias_adelantados THEN 'NEGATIVA'
            ELSE 'ESTABLE'
          END as tendencia
        FROM perfil_usuario pu
        CROSS JOIN resumen_libros rl
        CROSS JOIN estadisticas_progreso ep
        CROSS JOIN analisis_cumplimiento ac
      `;

      const librosEnProgreso = await this.prisma.$queryRaw`
        SELECT
          l.titulo,
          l.autor,
          pl.fecha_inicio,
          pl.estado,
          COUNT(d.id_detalle) as capitulos_totales,
          COUNT(CASE WHEN d.leido = true THEN 1 END) as capitulos_leidos,
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN d.leido = true THEN 1 END)::numeric /
               NULLIF(COUNT(d.id_detalle), 0)) * 100, 2
            ), 0
          ) as progreso,
          (CURRENT_DATE - pl.fecha_inicio) as dias_transcurridos
        FROM "books"."planlectura" pl
        JOIN "books"."libro" l ON pl.id_libro = l.id_libro
        LEFT JOIN "books"."detalleplanlectura" d ON pl.id_plan = d.id_plan
        WHERE pl.id = ${userId} AND pl.estado = 'ACTIVO'
        GROUP BY l.id_libro, l.titulo, l.autor, pl.fecha_inicio, pl.estado
        ORDER BY pl.fecha_inicio DESC
      `;

      return {
        overview: (overview as any[])[0] || {},
        librosEnProgreso: (librosEnProgreso as any[]) || []
      };

    } catch (error) {
      this.logger.error(`Error al obtener panorama general: ${error.message}`, error.stack);
      throw error;
    }
  }
}
