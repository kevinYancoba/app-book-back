import { ApiProperty } from '@nestjs/swagger';

export class UserOverviewDto {
  @ApiProperty({
    description: 'Información del perfil de lectura del usuario',
    example: {
      nivelLectura: 2,
      tiempoLecturaDiario: 45,
      horaPreferida: '19:30:00',
      incluirFinesSemana: true,
      autoAjustePlan: true
    }
  })
  perfilLectura: {
    nivelLectura: number;
    tiempoLecturaDiario: number;
    horaPreferida: string;
    incluirFinesSemana: boolean;
    autoAjustePlan: boolean;
  };

  @ApiProperty({
    description: 'Resumen de libros y planes',
    example: {
      totalLibros: 5,
      librosEnProgreso: 3,
      librosCompletados: 2,
      totalPlanes: 8,
      planesActivos: 3,
      planesCompletados: 4,
      planesPausados: 1
    }
  })
  resumenLibros: {
    totalLibros: number;
    librosEnProgreso: number;
    librosCompletados: number;
    totalPlanes: number;
    planesActivos: number;
    planesCompletados: number;
    planesPausados: number;
  };

  @ApiProperty({
    description: 'Estadísticas de progreso general',
    example: {
      totalCapitulos: 156,
      capitulosLeidos: 89,
      capitulosPendientes: 67,
      porcentajeProgreso: 57.05,
      paginasLeidas: 1245,
      tiempoTotalInvertido: 2340
    }
  })
  estadisticasProgreso: {
    totalCapitulos: number;
    capitulosLeidos: number;
    capitulosPendientes: number;
    porcentajeProgreso: number;
    paginasLeidas: number;
    tiempoTotalInvertido: number;
  };

  @ApiProperty({
    description: 'Análisis de cumplimiento y retrasos',
    example: {
      diasPlanificados: 45,
      diasCompletados: 32,
      diasAtrasados: 8,
      diasAdelantados: 5,
      porcentajeCumplimiento: 71.11,
      tendencia: 'POSITIVA'
    }
  })
  analisisCumplimiento: {
    diasPlanificados: number;
    diasCompletados: number;
    diasAtrasados: number;
    diasAdelantados: number;
    porcentajeCumplimiento: number;
    tendencia: 'POSITIVA' | 'NEGATIVA' | 'ESTABLE';
  };

  @ApiProperty({
    description: 'Libros actualmente en progreso',
    example: [
      {
        titulo: 'Libro Ejemplo',
        autor: 'Autor Ejemplo',
        progreso: 65.5,
        capitulosLeidos: 8,
        capitulosTotales: 12,
        fechaInicio: '2025-01-01',
        diasTranscurridos: 17,
        estado: 'ACTIVO'
      }
    ]
  })
  librosEnProgreso: {
    titulo: string;
    autor: string;
    progreso: number;
    capitulosLeidos: number;
    capitulosTotales: number;
    fechaInicio: string;
    diasTranscurridos: number;
    estado: string;
  }[];
}
