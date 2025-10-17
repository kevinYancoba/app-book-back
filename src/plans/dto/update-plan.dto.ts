import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Enum para nivel de lectura (debe coincidir con el de PerilLecturaDto)
export enum NivelLecturaEnum {
  novato = 5,
  intermedio = 10,
  profesional = 15,
  experto = 20,
}

export class UpdatePlanDto {
  @ApiProperty({
    example: 'Mi Plan de Lectura Personalizado',
    description: 'Nuevo título para el plan de lectura',
    required: false,
    minLength: 1,
    maxLength: 200
  })
  @IsOptional()
  @IsString({ message: 'El título debe ser texto' })
  @Length(1, 200, { message: 'El título debe tener entre 1 y 200 caracteres' })
  @Transform(({ value }) => value?.trim())
  titulo?: string;

  @ApiProperty({
    example: 'Plan personalizado para leer durante las vacaciones',
    description: 'Nueva descripción del plan',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @Length(0, 500, { message: 'La descripción no puede exceder 500 caracteres' })
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  // NOTA: La fecha de finalización se calcula automáticamente cuando se modifican
  // parámetros críticos (nivelLectura, paginasPorDia, tiempoEstimadoDia, incluirFinesSemana).
  // Este campo se mantiene por compatibilidad pero será ignorado si se proporcionan
  // los parámetros críticos mencionados.
  @ApiProperty({
    example: '2025-04-15T23:59:59Z',
    description: '[DEPRECADO] La fecha de finalización se calcula automáticamente. Este campo será ignorado si se proporcionan nivelLectura, paginasPorDia o tiempoEstimadoDia.',
    type: String,
    format: 'date-time',
    required: false,
    deprecated: true
  })
  @IsOptional()
  // @IsDateString({}, { message: 'La fecha de finalización debe ser una fecha válida' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  fechaFin?: Date;

  @ApiProperty({
    example: true,
    description: 'Si el plan incluye lectura en fines de semana',
    required: false
  })
  @IsOptional()
  @IsBoolean({ message: 'La preferencia de fines de semana debe ser verdadero o falso' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  incluirFinesSemana?: boolean;

  @ApiProperty({
    example: 10,
    description: 'Nuevo número de páginas por día',
    required: false,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsNumber({}, { message: 'Las páginas por día deben ser un número' })
  @Min(1, { message: 'Debe leer al menos 1 página por día' })
  @Max(100, { message: 'No se pueden leer más de 100 páginas por día' })
  @Type(() => Number)
  paginasPorDia?: number;

  @ApiProperty({
    example: 60,
    description: 'Nuevo tiempo estimado de lectura por día en minutos',
    required: false,
    minimum: 5,
    maximum: 480
  })
  @IsOptional()
  @IsNumber({}, { message: 'El tiempo estimado debe ser un número' })
  @Min(5, { message: 'El tiempo mínimo de lectura es 5 minutos' })
  @Max(480, { message: 'El tiempo máximo de lectura es 8 horas (480 minutos)' })
  @Type(() => Number)
  tiempoEstimadoDia?: number;

  @ApiProperty({
    example: 'intermedio',
    description: 'Nuevo nivel de lectura del usuario (páginas por día). Si se proporciona, sobrescribe paginasPorDia',
    enum: ['novato', 'intermedio', 'profesional', 'experto'],
    required: false
  })
  @IsOptional()
  @IsEnum(NivelLecturaEnum, {
    message: 'Nivel de lectura inválido. Debe ser: novato, intermedio, profesional o experto'
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const niveles = {
        'novato': NivelLecturaEnum.novato,
        'intermedio': NivelLecturaEnum.intermedio,
        'profesional': NivelLecturaEnum.profesional,
        'experto': NivelLecturaEnum.experto
      };
      return niveles[value.toLowerCase()];
    }
    return value;
  })
  nivelLectura?: NivelLecturaEnum;

  @ApiProperty({
    example: '20:00:00',
    description: 'Nueva hora preferida para la lectura',
    type: String,
    format: 'time',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  horaPreferida?: Date;

  @ApiProperty({
    example: true,
    description: 'Si se debe regenerar automáticamente los detalles del plan cuando cambian parámetros críticos',
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean({ message: 'La opción de regenerar debe ser verdadero o falso' })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return true; // Por defecto true
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  regenerarDetalles?: boolean;
}
