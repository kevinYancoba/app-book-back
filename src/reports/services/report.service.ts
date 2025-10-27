import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ReportRepository } from '../report-repository';
import { UserOverviewDto } from '../dto/user-overview.dto';


@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(private readonly reportRepository: ReportRepository) {}

  async getUserOverview(userId: number): Promise<UserOverviewDto> {
    try {
      this.logger.log(`Generando panorama general para usuario ${userId}`);

      const data = await this.reportRepository.getUserOverview(userId);
      const overview = data.overview as any;
      const librosEnProgreso = data.librosEnProgreso as any[];

      const userOverview: UserOverviewDto = {
        perfilLectura: {
          nivelLectura: overview.nivel_lectura || 0,
          tiempoLecturaDiario: overview.tiempo_lectura_diario || 0,
          horaPreferida: overview.hora_preferida || '00:00:00',
          incluirFinesSemana: overview.incluir_fines_de_semana || false,
          autoAjustePlan: overview.auto_ajuste_plan || false
        },
        resumenLibros: {
          totalLibros: Number(overview.total_libros) || 0,
          librosEnProgreso: Number(overview.libros_en_progreso) || 0,
          librosCompletados: Number(overview.libros_completados) || 0,
          totalPlanes: Number(overview.total_planes) || 0,
          planesActivos: Number(overview.planes_activos) || 0,
          planesCompletados: Number(overview.planes_completados) || 0,
          planesPausados: Number(overview.planes_pausados) || 0
        },
        estadisticasProgreso: {
          totalCapitulos: Number(overview.total_capitulos) || 0,
          capitulosLeidos: Number(overview.capitulos_leidos) || 0,
          capitulosPendientes: Number(overview.capitulos_pendientes) || 0,
          porcentajeProgreso: Number(overview.porcentaje_progreso) || 0,
          paginasLeidas: Number(overview.paginas_leidas) || 0,
          tiempoTotalInvertido: Number(overview.tiempo_total_invertido) || 0
        },
        analisisCumplimiento: {
          diasPlanificados: Number(overview.dias_planificados) || 0,
          diasCompletados: Number(overview.dias_completados) || 0,
          diasAtrasados: Number(overview.dias_atrasados) || 0,
          diasAdelantados: Number(overview.dias_adelantados) || 0,
          porcentajeCumplimiento: Number(overview.porcentaje_cumplimiento) || 0,
          tendencia: overview.tendencia || 'ESTABLE'
        },
        librosEnProgreso: librosEnProgreso.map(libro => ({
          titulo: libro.titulo || '',
          autor: libro.autor || '',
          progreso: Number(libro.progreso) || 0,
          capitulosLeidos: Number(libro.capitulos_leidos) || 0,
          capitulosTotales: Number(libro.capitulos_totales) || 0,
          fechaInicio: libro.fecha_inicio ? libro.fecha_inicio.toISOString().split('T')[0] : '',
          diasTranscurridos: Number(libro.dias_transcurridos) || 0,
          estado: libro.estado || ''
        }))
      };

      this.logger.log(`Panorama general generado para usuario ${userId}`);
      return userOverview;

    } catch (error) {
      this.logger.error(`Error al generar panorama general: ${error.message}`, error.stack);
      throw new HttpException(
        'Error interno del servidor al generar panorama general',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
