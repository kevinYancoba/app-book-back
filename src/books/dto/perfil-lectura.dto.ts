import { ApiProperty } from '@nestjs/swagger';
import {
  IsBase64,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsDateString,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Enum debe estar antes de la clase
export enum perfilLectura {
  novato = 5,
  intermedio = 10,
  profesional = 15,
  experto = 20,
}

export class PerilLecturaDto {
  @ApiProperty({
    example: 1,
    description: 'ID del usuario.',
    minimum: 1
  })
  @IsNotEmpty({ message: 'El ID del usuario es requerido' })
  @IsNumber({}, { message: 'El ID del usuario debe ser un número' })
  @Min(1, { message: 'El ID del usuario debe ser mayor a 0' })
  @Type(() => Number)
  idUsuario: number;

  @ApiProperty({
    example: 'novato',
    description: 'Nivel de lectura del usuario (páginas por día).',
    enum: ['novato', 'intermedio', 'profesional', 'experto'],
  })
  @IsNotEmpty({ message: 'El nivel de lectura es requerido' })
  @IsEnum(perfilLectura, { message: 'Nivel de lectura inválido. Debe ser: novato, intermedio, profesional o experto' })
  @Transform(({ value }) => {
    // Convertir string a valor del enum
    if (typeof value === 'string') {
      const niveles = {
        'novato': perfilLectura.novato,
        'intermedio': perfilLectura.intermedio,
        'profesional': perfilLectura.profesional,
        'experto': perfilLectura.experto
      };
      return niveles[value.toLowerCase()] || perfilLectura.novato;
    }
    return value;
  })
  nivelLectura: perfilLectura;

  @ApiProperty({
    example: 30,
    description: 'Tiempo de lectura diario en minutos.',
    minimum: 5,
    maximum: 480
  })
  @IsNotEmpty({ message: 'El tiempo de lectura diario es requerido' })
  @IsNumber({}, { message: 'El tiempo de lectura debe ser un número' })
  @Min(5, { message: 'El tiempo mínimo de lectura es 5 minutos' })
  @Max(480, { message: 'El tiempo máximo de lectura es 8 horas (480 minutos)' })
  @Type(() => Number)
  tiempoLecturaDiario: number;

  @ApiProperty({
    example: '2025-09-20T20:00:00Z',
    description: 'Horario preferido para la lectura.',
    type: String,
    format: 'date-time',
  })
  @IsNotEmpty({ message: 'El horario de lectura es requerido' })
  // @IsDateString({}, { message: 'El horario de lectura debe ser una fecha válida' })
  @Transform(({ value }) => new Date(value))
  horaioLectura: Date;

  // NOTA: La fecha de finalización (fechaFin) se calcula automáticamente por el sistema
  // basándose en:
  // - nivelLectura (páginas por día según el nivel: novato=5, intermedio=10, profesional=15, experto=20)
  // - tiempoLecturaDiario (minutos disponibles por día)
  // - Total de páginas del libro (extraído del OCR)
  // - finesSemana (si se incluyen o no los fines de semana)
  // El sistema valida que la relación tiempo/páginas sea realista y ajusta automáticamente si es necesario.

  @ApiProperty({
    example: true,
    description: 'Indica si se lee durante los fines de semana.',
  })
  @IsNotEmpty({ message: 'La preferencia de fines de semana es requerida' })
  @IsBoolean({ message: 'La preferencia de fines de semana debe ser verdadero o falso' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  finesSemana: boolean;

  @ApiProperty({
    example: 'Cien años de soledad',
    description: 'Título del libro a leer.',
    minLength: 1,
    maxLength: 200
  })
  @IsNotEmpty({ message: 'El título del libro es requerido' })
  @IsString({ message: 'El título del libro debe ser texto' })
  @Length(1, 200, { message: 'El título debe tener entre 1 y 200 caracteres' })
  @Transform(({ value }) => value?.trim())
  tituloLibro: string;

  @ApiProperty({
    example: 'Gabriel García Márquez',
    description: 'Autor del libro.',
    minLength: 1,
    maxLength: 150
  })
  @IsNotEmpty({ message: 'El autor del libro es requerido' })
  @IsString({ message: 'El autor del libro debe ser texto' })
  @Length(1, 150, { message: 'El autor debe tener entre 1 y 150 caracteres' })
  @Transform(({ value }) => value?.trim())
  autorLibro: string;

  @ApiProperty({
    example: 'SGVsbG8gd29ybGQ=',
    description: 'Índice del libro en formato Base64.',
  })
  @IsNotEmpty({ message: 'La imagen del índice es requerida' })
  @IsString({ message: 'La imagen debe ser una cadena de texto' })
  @IsBase64({}, { message: 'La imagen debe estar en formato Base64 válido' })
  indiceBase64: string;
}

// DTO para validar la respuesta del OCR
export class OcrResponseDto {
  @ApiProperty({
    description: 'Estructura de capítulos extraída del OCR',
    example: {
      titulos: ['Ser antes de hacer', 'Sé un siervo con un mundo interior organizado'],
      numeros_capitulo: [1, 2],
      paginas_capitulo: [15, 20]
    }
  })
  capitulos: {
    titulos: string[],
    numeros_capitulo: number[],
    paginas_capitulo: number[]
  };
}
