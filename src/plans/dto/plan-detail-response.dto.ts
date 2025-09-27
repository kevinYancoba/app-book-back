import { ApiProperty } from '@nestjs/swagger';
import { PlanResponseDto } from './plan-response.dto';

export class PlanDetailItemDto {
  @ApiProperty({ example: 1, description: 'ID único del detalle del plan' })
  id_detalle: number;

  @ApiProperty({ example: 1, description: 'ID del plan al que pertenece' })
  id_plan: number;

  @ApiProperty({ example: 1, description: 'ID del capítulo asignado' })
  id_capitulo: number;

  @ApiProperty({ 
    example: '2025-01-15T00:00:00.000Z', 
    description: 'Fecha asignada para leer este detalle' 
  })
  fecha_asignada: Date;

  @ApiProperty({ 
    example: false, 
    description: 'Si ya fue leído' 
  })
  leido: boolean;

  @ApiProperty({ 
    example: 60, 
    description: 'Tiempo estimado de lectura en minutos' 
  })
  tiempo_estimado_minutos: number;

  @ApiProperty({ 
    example: 45, 
    description: 'Tiempo real invertido en minutos',
    required: false 
  })
  tiempo_real_minutos?: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Página de inicio para este día' 
  })
  pagina_inicio: number;

  @ApiProperty({ 
    example: 10, 
    description: 'Página de finalización para este día' 
  })
  pagina_fin: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Número del día en el plan' 
  })
  dia: number;

  @ApiProperty({ 
    example: 3, 
    description: 'Dificultad percibida (1-5)',
    required: false 
  })
  dificultad_percibida?: number;

  @ApiProperty({ 
    example: false, 
    description: 'Si está atrasado' 
  })
  es_atrasado: boolean;

  @ApiProperty({ 
    example: '2025-01-15T00:00:00.000Z', 
    description: 'Fecha en que se completó',
    required: false 
  })
  fecha_completado?: Date;

  @ApiProperty({ 
    example: 'Capítulo muy interesante, me gustó mucho', 
    description: 'Notas del usuario sobre este día',
    required: false 
  })
  notas?: string;

  @ApiProperty({ 
    example: '2025-01-10T10:30:00.000Z', 
    description: 'Fecha de creación del detalle' 
  })
  created_at: Date;

  @ApiProperty({ 
    example: '2025-01-15T20:45:00.000Z', 
    description: 'Fecha de última actualización' 
  })
  updated_at: Date;

  // Información del capítulo
  @ApiProperty({
    description: 'Información del capítulo asociado',
    example: {
      id_capitulo: 1,
      numero_capitulo: 1,
      titulo_capitulo: 'El comienzo de todo',
      paginas_estimadas: 15
    }
  })
  capitulo?: {
    id_capitulo: number;
    numero_capitulo: number;
    titulo_capitulo: string;
    paginas_estimadas: number;
  };
}

export class PlanDetailResponseDto extends PlanResponseDto {
  @ApiProperty({
    description: 'Detalles diarios del plan de lectura',
    type: [PlanDetailItemDto]
  })
  detalles: PlanDetailItemDto[];

  @ApiProperty({
    description: 'Progreso de lectura por fechas',
    example: [
      {
        id_progreso: 1,
        fecha: '2025-01-15T00:00:00.000Z',
        capitulos_leidos: 1,
        paginas_leidas: 10,
        tiempo_invertido_min: 45,
        completado: true,
        estado_dia: 'COMPLETADO',
        porcentaje_dia: 100.0,
        notas_dia: 'Buen día de lectura'
      }
    ]
  })
  progreso?: Array<{
    id_progreso: number;
    fecha: Date;
    capitulos_leidos: number;
    paginas_leidas: number;
    tiempo_invertido_min: number;
    completado: boolean;
    estado_dia: string;
    porcentaje_dia: number;
    notas_dia?: string;
  }>;
}
