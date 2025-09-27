import { ApiProperty } from '@nestjs/swagger';
import {
  IsBase64,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class PerilLecturaDto {
  @ApiProperty({ example: 1, description: 'ID del usuario.' })
  @IsNotEmpty()
  @IsNumber()
  idUsuario: number;

  @ApiProperty({
    example: 'novato',
    description: 'Nivel de lectura del usuario.',
    enum: ['novato', 'intermedio', 'profesional', 'experto'],
  })
  nivelLectura: perfilLectura;

  @ApiProperty({
    example: 30,
    description: 'Tiempo de lectura diario en minutos.',
  })
  @IsNotEmpty()
  @IsNumber()
  tiempoLecturaDiario: number;

  @ApiProperty({
    example: '2025-09-20T20:00:00Z',
    description: 'Horario preferido para la lectura.',
    type: String,
    format: 'date-time',
  })
  horaioLectura: Date;

  @ApiProperty({
    example: '2025-10-20T20:00:00Z',
    description: 'Fecha de finalización estimada del libro.',
    type: String,
    format: 'date-time',
  })
  fechaFin: Date;

  @ApiProperty({
    example: true,
    description: 'Indica si se lee durante los fines de semana.',
  })
  @IsNotEmpty()
  @IsBoolean()
  finesSemana: boolean;

  @ApiProperty({
    example: 'Cien años de soledad',
    description: 'Título del libro a leer.',
  })
  @IsNotEmpty()
  @IsString()
  tituloLibro: string;

  @ApiProperty({
    example: 'Gabriel García Márquez',
    description: 'Autor del libro.',
  })
  @IsNotEmpty()
  @IsString()
  autorLibro: string;

  @ApiProperty({
    example: 'SGVsbG8gd29ybGQ=',
    description: 'Índice del libro en formato Base64.',
  })
  @IsNotEmpty()
  @IsString()
  @IsBase64()
  indiceBase64: string;
}

enum perfilLectura {
  novato = 5,
  intermedio = 10,
  profesional = 15,
  experto = 20,
}
