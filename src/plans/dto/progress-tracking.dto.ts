import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsDateString,
  IsArray,
  IsEnum,
  Min,
  Max,
  Length,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Enum para el estado del día
export enum DayStatusEnum {
  PENDIENTE = 'PENDIENTE',
  COMPLETADO = 'COMPLETADO',
  PARCIAL = 'PARCIAL',
  ATRASADO = 'ATRASADO',
  SALTADO = 'SALTADO'
}

// DTO para registrar progreso diario
export class DailyProgressDto {
  @ApiProperty({
    example: 1,
    description: 'ID del plan de lectura'
  })
  @IsNotEmpty({ message: 'El ID del plan es requerido' })
  @IsNumber({}, { message: 'El ID del plan debe ser un número' })
  @Min(1, { message: 'El ID del plan debe ser mayor a 0' })
  planId: number;

  @ApiProperty({
    example: '2025-01-15',
    description: 'Fecha del progreso (YYYY-MM-DD)',
    type: String,
    format: 'date'
  })
  @IsNotEmpty({ message: 'La fecha es requerida' })
  @IsDateString({}, { message: 'La fecha debe ser válida (YYYY-MM-DD)' })
  @Transform(({ value }) => new Date(value))
  fecha: Date;

  @ApiProperty({
    example: [1, 2],
    description: 'IDs de los capítulos leídos en este día',
    type: [Number]
  })
  @IsOptional()
  @IsArray({ message: 'Los capítulos leídos debe ser un array' })
  @IsNumber({}, { each: true, message: 'Cada ID de capítulo debe ser un número' })
  capitulosLeidos?: number[];

  @ApiProperty({
    example: 15,
    description: 'Número de páginas leídas en este día',
    minimum: 0
  })
  @IsOptional()
  @IsNumber({}, { message: 'Las páginas leídas deben ser un número' })
  @Min(0, { message: 'Las páginas leídas no pueden ser negativas' })
  paginasLeidas?: number;

  @ApiProperty({
    example: 45,
    description: 'Tiempo invertido en minutos',
    minimum: 0,
    maximum: 1440
  })
  @IsOptional()
  @IsNumber({}, { message: 'El tiempo invertido debe ser un número' })
  @Min(0, { message: 'El tiempo no puede ser negativo' })
  @Max(1440, { message: 'El tiempo no puede exceder 24 horas (1440 minutos)' })
  tiempoInvertidoMin?: number;

  @ApiProperty({
    example: 'COMPLETADO',
    description: 'Estado del día de lectura',
    enum: DayStatusEnum
  })
  @IsOptional()
  @IsEnum(DayStatusEnum, { 
    message: 'Estado inválido. Debe ser: PENDIENTE, COMPLETADO, PARCIAL, ATRASADO o SALTADO' 
  })
  estadoDia?: DayStatusEnum;

  @ApiProperty({
    example: 85.5,
    description: 'Porcentaje completado del día (0-100)',
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber({}, { message: 'El porcentaje debe ser un número' })
  @Min(0, { message: 'El porcentaje no puede ser negativo' })
  @Max(100, { message: 'El porcentaje no puede exceder 100' })
  porcentajeDia?: number;

  @ApiProperty({
    example: 'Capítulo muy interesante, me gustó la parte sobre...',
    description: 'Notas personales del día',
    maxLength: 1000,
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @Length(0, 1000, { message: 'Las notas no pueden exceder 1000 caracteres' })
  @Transform(({ value }) => value?.trim())
  notasDia?: string;
}

// DTO para actualizar progreso específico
export class UpdateProgressDto {
  @ApiProperty({
    example: 20,
    description: 'Nuevo número de páginas leídas',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Las páginas leídas deben ser un número' })
  @Min(0, { message: 'Las páginas leídas no pueden ser negativas' })
  paginasLeidas?: number;

  @ApiProperty({
    example: 60,
    description: 'Nuevo tiempo invertido en minutos',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El tiempo invertido debe ser un número' })
  @Min(0, { message: 'El tiempo no puede ser negativo' })
  @Max(1440, { message: 'El tiempo no puede exceder 24 horas' })
  tiempoInvertidoMin?: number;

  @ApiProperty({
    example: 'COMPLETADO',
    description: 'Nuevo estado del día',
    enum: DayStatusEnum,
    required: false
  })
  @IsOptional()
  @IsEnum(DayStatusEnum, { 
    message: 'Estado inválido. Debe ser: PENDIENTE, COMPLETADO, PARCIAL, ATRASADO o SALTADO' 
  })
  estadoDia?: DayStatusEnum;

  @ApiProperty({
    example: 100.0,
    description: 'Nuevo porcentaje del día',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El porcentaje debe ser un número' })
  @Min(0, { message: 'El porcentaje no puede ser negativo' })
  @Max(100, { message: 'El porcentaje no puede exceder 100' })
  porcentajeDia?: number;

  @ApiProperty({
    example: 'Notas actualizadas del día de lectura',
    description: 'Nuevas notas del día',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @Length(0, 1000, { message: 'Las notas no pueden exceder 1000 caracteres' })
  @Transform(({ value }) => value?.trim())
  notasDia?: string;
}

// DTO para marcar detalles del plan como leídos
export class MarkChapterReadDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'IDs de los detalles del plan a marcar como leídos',
    type: [Number]
  })
  @IsNotEmpty({ message: 'Los IDs de detalles son requeridos' })
  @IsArray({ message: 'Los detalles debe ser un array' })
  @IsNumber({}, { each: true, message: 'Cada ID de detalle debe ser un número' })
  detalleIds: number[];

  @ApiProperty({
    example: 45,
    description: 'Tiempo real invertido en minutos',
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'El tiempo real debe ser un número' })
  @Min(0, { message: 'El tiempo no puede ser negativo' })
  tiempoRealMinutos?: number;

  @ApiProperty({
    example: 3,
    description: 'Dificultad percibida (1-5)',
    minimum: 1,
    maximum: 5,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'La dificultad debe ser un número' })
  @Min(1, { message: 'La dificultad mínima es 1' })
  @Max(5, { message: 'La dificultad máxima es 5' })
  dificultadPercibida?: number;

  @ApiProperty({
    example: 'Capítulo muy interesante, conceptos claros',
    description: 'Notas sobre los capítulos leídos',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  @Length(0, 500, { message: 'Las notas no pueden exceder 500 caracteres' })
  @Transform(({ value }) => value?.trim())
  notas?: string;
}
