import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsDateString, IsEnum, Min } from 'class-validator';
import { Transform } from 'class-transformer';

// Enum para tipos de período de análisis
export enum PeriodTypeEnum {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  CUSTOM = 'CUSTOM'
}

// DTO para filtros del dashboard
export class DashboardFiltersDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario para filtrar reportes',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  @Min(1, { message: 'El ID del usuario debe ser mayor a 0' })
  userId?: number;

  @ApiProperty({
    example: 1,
    description: 'ID del plan específico para analizar',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El ID del plan debe ser un número' })
  @Min(1, { message: 'El ID del plan debe ser mayor a 0' })
  planId?: number;

  @ApiProperty({
    example: 'MONTH',
    description: 'Tipo de período para el análisis',
    enum: PeriodTypeEnum,
    required: false
  })
  @IsOptional()
  @IsEnum(PeriodTypeEnum, { 
    message: 'Período inválido. Debe ser: WEEK, MONTH, QUARTER, YEAR o CUSTOM' 
  })
  period?: PeriodTypeEnum;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Fecha de inicio para período personalizado',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser válida' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  startDate?: Date;

  @ApiProperty({
    example: '2025-01-31',
    description: 'Fecha de fin para período personalizado',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser válida' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  endDate?: Date;
}

// DTO para métricas generales del dashboard
export class DashboardMetricsDto {
  @ApiProperty({
    description: 'Métricas generales de lectura',
    example: {
      totalLibrosLeidos: 5,
      totalPaginasLeidas: 1250,
      totalTiempoInvertido: 3600,
      promedioTiempoDiario: 45.5,
      velocidadLecturaPromedio: 12.8,
      librosEnProgreso: 2,
      planesActivos: 3
    }
  })
  metricas: {
    totalLibrosLeidos: number;
    totalPaginasLeidas: number;
    totalTiempoInvertido: number; // en minutos
    promedioTiempoDiario: number;
    velocidadLecturaPromedio: number; // páginas por hora
    librosEnProgreso: number;
    planesActivos: number;
  };

  @ApiProperty({
    description: 'Comparación con período anterior',
    example: {
      paginasLeidasCambio: 15.5,
      tiempoInvertidoCambio: -8.2,
      velocidadLecturaCambio: 3.1,
      consistenciaCambio: 12.0
    }
  })
  comparacion: {
    paginasLeidasCambio: number; // porcentaje
    tiempoInvertidoCambio: number; // porcentaje
    velocidadLecturaCambio: number; // porcentaje
    consistenciaCambio: number; // porcentaje
  };

  @ApiProperty({
    description: 'Objetivos y metas',
    example: {
      metaPaginasDiarias: 20,
      metaTiempoDiario: 60,
      progresoMetaPaginas: 85.5,
      progresoMetaTiempo: 92.3,
      diasConsecutivos: 12,
      mejorRacha: 25
    }
  })
  objetivos: {
    metaPaginasDiarias: number;
    metaTiempoDiario: number;
    progresoMetaPaginas: number; // porcentaje
    progresoMetaTiempo: number; // porcentaje
    diasConsecutivos: number;
    mejorRacha: number;
  };
}

// DTO para análisis de tendencias
export class TrendAnalysisDto {
  @ApiProperty({
    description: 'Datos de tendencia diaria',
    type: 'array',
    example: [
      {
        fecha: '2025-01-15',
        paginasLeidas: 25,
        tiempoInvertido: 60,
        velocidadLectura: 25.0,
        completado: true
      }
    ]
  })
  tendenciaDiaria: Array<{
    fecha: string;
    paginasLeidas: number;
    tiempoInvertido: number;
    velocidadLectura: number;
    completado: boolean;
  }>;

  @ApiProperty({
    description: 'Análisis de patrones semanales',
    example: {
      mejorDiaSemana: 'Sábado',
      peorDiaSemana: 'Lunes',
      promedioFinesSemana: 35.2,
      promedioEntresemana: 18.7,
      consistenciaGeneral: 78.5
    }
  })
  patronesSemana: {
    mejorDiaSemana: string;
    peorDiaSemana: string;
    promedioFinesSemana: number;
    promedioEntresemana: number;
    consistenciaGeneral: number;
  };

  @ApiProperty({
    description: 'Predicciones y proyecciones',
    example: {
      fechaFinalizacionEstimada: '2025-03-15',
      paginasRestantes: 125,
      diasRestantesEstimados: 8,
      probabilidadCumplimiento: 85.5,
      recomendacionAjuste: 'Aumentar 5 páginas por día'
    }
  })
  predicciones: {
    fechaFinalizacionEstimada: string;
    paginasRestantes: number;
    diasRestantesEstimados: number;
    probabilidadCumplimiento: number;
    recomendacionAjuste: string;
  };
}

// DTO para análisis de rendimiento
export class PerformanceAnalysisDto {
  @ApiProperty({
    description: 'Análisis de velocidad de lectura',
    example: {
      velocidadActual: 15.2,
      velocidadPromedio: 12.8,
      velocidadMaxima: 22.1,
      velocidadMinima: 8.5,
      tendenciaVelocidad: 'MEJORANDO',
      factoresInfluencia: ['Hora del día', 'Tipo de contenido']
    }
  })
  velocidadLectura: {
    velocidadActual: number;
    velocidadPromedio: number;
    velocidadMaxima: number;
    velocidadMinima: number;
    tendenciaVelocidad: 'MEJORANDO' | 'ESTABLE' | 'DISMINUYENDO';
    factoresInfluencia: string[];
  };

  @ApiProperty({
    description: 'Análisis de consistencia',
    example: {
      diasCompletados: 25,
      diasTotales: 30,
      porcentajeConsistencia: 83.3,
      rachaActual: 5,
      mejorRacha: 12,
      diasSinLeer: 2
    }
  })
  consistencia: {
    diasCompletados: number;
    diasTotales: number;
    porcentajeConsistencia: number;
    rachaActual: number;
    mejorRacha: number;
    diasSinLeer: number;
  };

  @ApiProperty({
    description: 'Análisis de dificultad percibida',
    example: {
      dificultadPromedio: 3.2,
      librosCompletos: 5,
      librosAbandonados: 1,
      tiempoPromedioCapitulo: 45.5,
      capitulosMasDificiles: ['Capítulo 8: Conceptos Avanzados']
    }
  })
  dificultad: {
    dificultadPromedio: number;
    librosCompletos: number;
    librosAbandonados: number;
    tiempoPromedioCapitulo: number;
    capitulosMasDificiles: string[];
  };
}

// DTO para alertas y recomendaciones
export class AlertsRecommendationsDto {
  @ApiProperty({
    description: 'Alertas del sistema',
    type: 'array',
    example: [
      {
        tipo: 'ATRASO',
        severidad: 'ALTA',
        mensaje: 'Llevas 3 días de atraso en tu plan actual',
        accionRecomendada: 'Aumentar tiempo de lectura diario'
      }
    ]
  })
  alertas: Array<{
    tipo: 'ATRASO' | 'VELOCIDAD' | 'CONSISTENCIA' | 'META';
    severidad: 'BAJA' | 'MEDIA' | 'ALTA';
    mensaje: string;
    accionRecomendada: string;
  }>;

  @ApiProperty({
    description: 'Recomendaciones personalizadas',
    type: 'array',
    example: [
      {
        categoria: 'HORARIO',
        titulo: 'Optimizar horario de lectura',
        descripcion: 'Tus mejores sesiones son por la mañana',
        impactoEstimado: 'Aumento del 20% en velocidad'
      }
    ]
  })
  recomendaciones: Array<{
    categoria: 'HORARIO' | 'VELOCIDAD' | 'CONTENIDO' | 'HABITOS';
    titulo: string;
    descripcion: string;
    impactoEstimado: string;
  }>;

  @ApiProperty({
    description: 'Logros y celebraciones',
    type: 'array',
    example: [
      {
        tipo: 'RACHA',
        titulo: '🔥 ¡Racha de 7 días!',
        descripcion: 'Has leído consistentemente por una semana',
        fechaLogro: '2025-01-15'
      }
    ]
  })
  logros: Array<{
    tipo: 'RACHA' | 'VELOCIDAD' | 'PAGINAS' | 'LIBRO_COMPLETADO';
    titulo: string;
    descripcion: string;
    fechaLogro: string;
  }>;
}
