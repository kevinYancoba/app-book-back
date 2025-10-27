import { ApiProperty } from '@nestjs/swagger';
import { DayStatusEnum } from './progress-tracking.dto';

// DTO de respuesta para progreso diario
export class ProgressResponseDto {
  @ApiProperty({ example: 1, description: 'ID único del progreso' })
  id_progreso: number;

  @ApiProperty({ example: 1, description: 'ID del plan asociado' })
  id_plan: number;

  @ApiProperty({ 
    example: '2025-01-15T00:00:00.000Z', 
    description: 'Fecha del progreso' 
  })
  fecha: Date;

  @ApiProperty({ 
    example: 2, 
    description: 'Número de capítulos leídos' 
  })
  capitulos_leidos: number;

  @ApiProperty({ 
    example: 15, 
    description: 'Páginas leídas en el día' 
  })
  paginas_leidas: number;

  @ApiProperty({ 
    example: 45, 
    description: 'Tiempo invertido en minutos' 
  })
  tiempo_invertido_min: number;

  @ApiProperty({ 
    example: true, 
    description: 'Si el día fue completado' 
  })
  completado: boolean;

  @ApiProperty({ 
    example: 'COMPLETADO', 
    description: 'Estado del día',
    enum: DayStatusEnum
  })
  estado_dia: DayStatusEnum;

  @ApiProperty({ 
    example: 100.0, 
    description: 'Porcentaje completado del día' 
  })
  porcentaje_dia: number;

  @ApiProperty({ 
    example: 'Excelente día de lectura, muy productivo', 
    description: 'Notas del día',
    required: false 
  })
  notas_dia?: string;

  @ApiProperty({ 
    example: '2025-01-15T10:30:00.000Z', 
    description: 'Fecha de creación' 
  })
  created_at: Date;
}

// DTO para historial de progreso
export class ProgressHistoryDto {
  @ApiProperty({
    description: 'Lista de progreso diario',
    type: [ProgressResponseDto]
  })
  progreso: ProgressResponseDto[];

  @ApiProperty({
    description: 'Estadísticas del historial',
    example: {
      totalDias: 30,
      diasCompletados: 25,
      diasParciales: 3,
      diasAtrasados: 2,
      promedioTiempoDiario: 42.5,
      promedioPaginasDiarias: 12.8,
      rachaActual: 5,
      mejorRacha: 12
    }
  })
  estadisticas: {
    totalDias: number;
    diasCompletados: number;
    diasParciales: number;
    diasAtrasados: number;
    promedioTiempoDiario: number;
    promedioPaginasDiarias: number;
    rachaActual: number;
    mejorRacha: number;
  };
}

// DTO para dashboard de progreso
export class ProgressDashboardDto {
  @ApiProperty({
    description: 'Información del plan',
    example: {
      id_plan: 1,
      titulo: 'Mi Plan de Lectura',
      estado: 'ACTIVO',
      progreso_porcentaje: 65.5
    }
  })
  plan: {
    id_plan: number;
    titulo: string;
    estado: string;
    progreso_porcentaje: number;
    fecha_inicio: Date;
    fecha_fin: Date;
  };

  @ApiProperty({
    description: 'Progreso general',
    example: {
      totalCapitulos: 20,
      capitulosCompletados: 13,
      totalPaginas: 400,
      paginasLeidas: 262,
      porcentajeGeneral: 65.5,
      diasTranscurridos: 25,
      diasRestantes: 15,
      diasAtrasado: 2
    }
  })
  progresoGeneral: {
    totalCapitulos: number;
    capitulosCompletados: number;
    totalPaginas: number;
    paginasLeidas: number;
    porcentajeGeneral: number;
    diasTranscurridos: number;
    diasRestantes: number;
    diasAtrasado: number;
  };

  @ApiProperty({
    description: 'Estadísticas de rendimiento',
    example: {
      promedioTiempoDiario: 42.5,
      promedioPaginasDiarias: 12.8,
      velocidadLectura: 8.5,
      consistencia: 85.2,
      rachaActual: 5,
      mejorRacha: 12
    }
  })
  rendimiento: {
    promedioTiempoDiario: number;
    promedioPaginasDiarias: number;
    velocidadLectura: number; // páginas por hora
    consistencia: number; // porcentaje de días cumplidos
    rachaActual: number;
    mejorRacha: number;
  };

  @ApiProperty({
    description: 'Progreso de los últimos 7 días',
    type: [ProgressResponseDto]
  })
  ultimosSieteDias: ProgressResponseDto[];

  @ApiProperty({
    description: 'Próximas tareas pendientes',
    example: [
      {
        id_detalle: 15,
        fecha_asignada: '2025-01-16T00:00:00.000Z',
        capitulo: 'Capítulo 8: El desarrollo',
        pagina_inicio: 120,
        pagina_fin: 135,
        tiempo_estimado: 45
      }
    ]
  })
  proximasTareas: Array<{
    id_detalle: number;
    fecha_asignada: Date;
    capitulo: string;
    pagina_inicio: number;
    pagina_fin: number;
    tiempo_estimado: number;
  }>;

  @ApiProperty({
    description: 'Alertas y recomendaciones',
    example: {
      alertas: [
        'Llevas 2 días de atraso en tu plan',
        'Tu velocidad de lectura ha disminuido esta semana'
      ],
      recomendaciones: [
        'Considera aumentar el tiempo de lectura diario a 50 minutos',
        'Intenta leer en un horario más consistente'
      ]
    }
  })
  alertasYRecomendaciones: {
    alertas: string[];
    recomendaciones: string[];
  };
}

// DTO para respuesta de marcar capítulos como leídos
export class ChapterMarkResponseDto {
  @ApiProperty({
    example: 'Capítulos marcados como leídos exitosamente',
    description: 'Mensaje de confirmación'
  })
  mensaje: string;

  @ApiProperty({
    example: 3,
    description: 'Número de capítulos marcados'
  })
  capitulosMarcados: number;

  @ApiProperty({
    example: 75.5,
    description: 'Nuevo porcentaje de progreso del plan'
  })
  nuevoProgreso: number;

  @ApiProperty({
    description: 'Detalles actualizados',
    example: [
      {
        id_detalle: 1,
        leido: true,
        fecha_completado: '2025-01-15T20:30:00.000Z',
        tiempo_real_minutos: 45
      }
    ]
  })
  detallesActualizados: Array<{
    id_detalle: number;
    leido: boolean;
    fecha_completado: Date;
    tiempo_real_minutos?: number;
    notas?: string;
  }>;
}
