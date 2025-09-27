import { ApiProperty } from '@nestjs/swagger';
import { 
  DashboardMetricsDto, 
  TrendAnalysisDto, 
  PerformanceAnalysisDto, 
  AlertsRecommendationsDto 
} from './dashboard.dto';

// DTO principal del dashboard completo
export class CompleteDashboardDto {
  @ApiProperty({
    description: 'Información del usuario y período',
    example: {
      userId: 1,
      userName: 'Juan Pérez',
      periodoAnalisis: 'MONTH',
      fechaInicio: '2025-01-01T00:00:00.000Z',
      fechaFin: '2025-01-31T23:59:59.000Z',
      fechaGeneracion: '2025-01-15T10:30:00.000Z'
    }
  })
  informacion: {
    userId: number;
    userName: string;
    periodoAnalisis: string;
    fechaInicio: Date;
    fechaFin: Date;
    fechaGeneracion: Date;
  };

  @ApiProperty({
    description: 'Métricas generales del dashboard',
    type: DashboardMetricsDto
  })
  metricas: DashboardMetricsDto;

  @ApiProperty({
    description: 'Análisis de tendencias y patrones',
    type: TrendAnalysisDto
  })
  tendencias: TrendAnalysisDto;

  @ApiProperty({
    description: 'Análisis de rendimiento detallado',
    type: PerformanceAnalysisDto
  })
  rendimiento: PerformanceAnalysisDto;

  @ApiProperty({
    description: 'Alertas y recomendaciones',
    type: AlertsRecommendationsDto
  })
  alertasRecomendaciones: AlertsRecommendationsDto;

  @ApiProperty({
    description: 'Resumen de planes activos',
    type: 'array',
    example: [
      {
        id_plan: 1,
        titulo: 'Plan de Lectura Enero',
        libro: 'El Arte de la Guerra',
        progreso: 65.5,
        estado: 'ACTIVO',
        diasRestantes: 12,
        atrasado: false
      }
    ]
  })
  planesActivos: Array<{
    id_plan: number;
    titulo: string;
    libro: string;
    progreso: number;
    estado: string;
    diasRestantes: number;
    atrasado: boolean;
  }>;
}

// DTO para dashboard simplificado (vista rápida)
export class QuickDashboardDto {
  @ApiProperty({
    description: 'Métricas clave del día',
    example: {
      paginasLeidasHoy: 15,
      tiempoInvertidoHoy: 45,
      metaDiariaAlcanzada: true,
      rachaActual: 7,
      progresoSemanal: 85.2
    }
  })
  metricas: {
    paginasLeidasHoy: number;
    tiempoInvertidoHoy: number;
    metaDiariaAlcanzada: boolean;
    rachaActual: number;
    progresoSemanal: number;
  };

  @ApiProperty({
    description: 'Próximas tareas del día',
    type: 'array',
    example: [
      {
        planId: 1,
        libro: 'El Arte de la Guerra',
        capitulo: 'Capítulo 5: La Energía',
        paginasEstimadas: 12,
        tiempoEstimado: 30
      }
    ]
  })
  tareasHoy: Array<{
    planId: number;
    libro: string;
    capitulo: string;
    paginasEstimadas: number;
    tiempoEstimado: number;
  }>;

  @ApiProperty({
    description: 'Alertas importantes',
    type: 'array',
    example: [
      {
        tipo: 'ATRASO',
        mensaje: 'Plan "Lectura Enero" tiene 2 días de atraso'
      }
    ]
  })
  alertas: Array<{
    tipo: string;
    mensaje: string;
  }>;
}

// DTO para análisis comparativo
export class ComparativeAnalysisDto {
  @ApiProperty({
    description: 'Comparación con período anterior',
    example: {
      periodoActual: 'Enero 2025',
      periodoAnterior: 'Diciembre 2024',
      metricas: {
        paginasLeidas: { actual: 450, anterior: 380, cambio: 18.4 },
        tiempoInvertido: { actual: 1200, anterior: 1100, cambio: 9.1 },
        librosCompletados: { actual: 2, anterior: 1, cambio: 100.0 },
        velocidadPromedio: { actual: 15.2, anterior: 13.8, cambio: 10.1 }
      }
    }
  })
  comparacionPeriodo: {
    periodoActual: string;
    periodoAnterior: string;
    metricas: {
      paginasLeidas: { actual: number; anterior: number; cambio: number };
      tiempoInvertido: { actual: number; anterior: number; cambio: number };
      librosCompletados: { actual: number; anterior: number; cambio: number };
      velocidadPromedio: { actual: number; anterior: number; cambio: number };
    };
  };

  @ApiProperty({
    description: 'Comparación con otros usuarios (anónima)',
    example: {
      posicionRanking: 15,
      totalUsuarios: 100,
      percentil: 85,
      promedioGeneral: {
        paginasDiarias: 12.5,
        tiempoDiario: 38.2,
        velocidadLectura: 11.8
      },
      tuRendimiento: {
        paginasDiarias: 18.3,
        tiempoDiario: 45.5,
        velocidadLectura: 15.2
      }
    }
  })
  comparacionUsuarios: {
    posicionRanking: number;
    totalUsuarios: number;
    percentil: number;
    promedioGeneral: {
      paginasDiarias: number;
      tiempoDiario: number;
      velocidadLectura: number;
    };
    tuRendimiento: {
      paginasDiarias: number;
      tiempoDiario: number;
      velocidadLectura: number;
    };
  };
}

// DTO para reportes exportables
export class ExportableReportDto {
  @ApiProperty({
    description: 'Metadatos del reporte',
    example: {
      tipoReporte: 'DASHBOARD_COMPLETO',
      fechaGeneracion: '2025-01-15T10:30:00.000Z',
      periodo: 'MONTH',
      usuario: 'Juan Pérez',
      version: '1.0'
    }
  })
  metadata: {
    tipoReporte: string;
    fechaGeneracion: Date;
    periodo: string;
    usuario: string;
    version: string;
  };

  @ApiProperty({
    description: 'Datos del dashboard para exportar',
    type: CompleteDashboardDto
  })
  dashboard: CompleteDashboardDto;

  @ApiProperty({
    description: 'Datos adicionales para análisis',
    example: {
      datosRaw: true,
      incluirGraficos: true,
      formatoExportacion: 'PDF'
    }
  })
  configuracionExportacion: {
    datosRaw: boolean;
    incluirGraficos: boolean;
    formatoExportacion: 'PDF' | 'EXCEL' | 'JSON';
  };
}

// DTO para métricas en tiempo real
export class RealTimeMetricsDto {
  @ApiProperty({
    description: 'Métricas actualizadas en tiempo real',
    example: {
      sesionActual: {
        inicioSesion: '2025-01-15T09:00:00.000Z',
        tiempoTranscurrido: 25,
        paginasLeidas: 8,
        velocidadActual: 19.2,
        capituloActual: 'Capítulo 3: Estrategias'
      },
      metasDelDia: {
        metaPaginas: 20,
        progresoMetaPaginas: 40.0,
        metaTiempo: 60,
        progresoMetaTiempo: 41.7,
        tiempoRestante: 35
      }
    }
  })
  sesionActual: {
    inicioSesion: Date;
    tiempoTranscurrido: number;
    paginasLeidas: number;
    velocidadActual: number;
    capituloActual: string;
  };

  @ApiProperty({
    description: 'Progreso hacia metas diarias'
  })
  metasDelDia: {
    metaPaginas: number;
    progresoMetaPaginas: number;
    metaTiempo: number;
    progresoMetaTiempo: number;
    tiempoRestante: number;
  };

  @ApiProperty({
    description: 'Notificaciones y recordatorios',
    type: 'array',
    example: [
      {
        tipo: 'RECORDATORIO',
        mensaje: 'Es hora de tu sesión de lectura',
        prioridad: 'MEDIA'
      }
    ]
  })
  notificaciones: Array<{
    tipo: 'RECORDATORIO' | 'LOGRO' | 'ALERTA';
    mensaje: string;
    prioridad: 'BAJA' | 'MEDIA' | 'ALTA';
  }>;
}
