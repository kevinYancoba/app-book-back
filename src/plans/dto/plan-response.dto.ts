import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({ example: 1, description: 'ID único del plan' })
  id_plan: number;

  @ApiProperty({ example: 1, description: 'ID del usuario propietario' })
  id: number;

  @ApiProperty({ example: 1, description: 'ID del libro asociado' })
  id_libro: number;

  @ApiProperty({ 
    example: '2025-01-15T00:00:00.000Z', 
    description: 'Fecha de inicio del plan' 
  })
  fecha_inicio: Date;

  @ApiProperty({ 
    example: '2025-03-15T00:00:00.000Z', 
    description: 'Fecha de finalización del plan' 
  })
  fecha_fin: Date;

  @ApiProperty({ 
    example: '2025-03-15T00:00:00.000Z', 
    description: 'Fecha de finalización original (antes de ajustes)' 
  })
  fecha_fin_original: Date;

  @ApiProperty({ 
    example: 'Mi Plan de Lectura', 
    description: 'Título del plan' 
  })
  titulo: string;

  @ApiProperty({ 
    example: 'Plan personalizado para leer durante las vacaciones', 
    description: 'Descripción del plan',
    required: false 
  })
  descripcion?: string;

  @ApiProperty({ 
    example: 'ACTIVO', 
    description: 'Estado actual del plan',
    enum: ['ACTIVO', 'COMPLETADO', 'PAUSADO', 'CANCELADO']
  })
  estado: string;

  @ApiProperty({ 
    example: 65.5, 
    description: 'Porcentaje de progreso del plan' 
  })
  progreso_porcentaje: number;

  @ApiProperty({ 
    example: true, 
    description: 'Si fue generado por IA' 
  })
  generado_por_ia: boolean;

  @ApiProperty({ 
    example: false, 
    description: 'Si es un plan personalizado por el usuario' 
  })
  es_personalizado: boolean;

  @ApiProperty({ 
    example: 2, 
    description: 'Días de atraso en el plan' 
  })
  dias_atrasado: number;

  @ApiProperty({ 
    example: true, 
    description: 'Si incluye lectura en fines de semana' 
  })
  incluir_fines_semana: boolean;

  @ApiProperty({ 
    example: 10, 
    description: 'Páginas planificadas por día' 
  })
  paginas_por_dia: number;

  @ApiProperty({ 
    example: 60, 
    description: 'Tiempo estimado de lectura por día en minutos' 
  })
  tiempo_estimado_dia: number;

  @ApiProperty({ 
    example: '2025-01-15T10:30:00.000Z', 
    description: 'Fecha de creación del plan' 
  })
  created_at: Date;

  @ApiProperty({ 
    example: '2025-01-20T15:45:00.000Z', 
    description: 'Fecha de última actualización' 
  })
  updated_at: Date;

  // Información del libro asociado
  @ApiProperty({
    description: 'Información del libro asociado al plan',
    example: {
      id_libro: 1,
      titulo: 'Cien años de soledad',
      autor: 'Gabriel García Márquez'
    }
  })
  libro?: {
    id_libro: number;
    titulo: string;
    autor: string;
  };

  // Estadísticas del plan
  @ApiProperty({
    description: 'Estadísticas del progreso del plan',
    example: {
      totalCapitulos: 20,
      capitulosCompletados: 13,
      totalPaginas: 400,
      paginasLeidas: 262,
      diasTranscurridos: 25,
      diasRestantes: 15
    }
  })
  estadisticas?: {
    totalCapitulos: number;
    capitulosCompletados: number;
    totalPaginas: number;
    paginasLeidas: number;
    diasTranscurridos: number;
    diasRestantes: number;
  };
}
