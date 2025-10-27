import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum PlanStatusEnum {
  ACTIVO = 'ACTIVO',
  COMPLETADO = 'COMPLETADO',
  PAUSADO = 'PAUSADO',
  CANCELADO = 'CANCELADO'
}

export class UpdatePlanStatusDto {
  @ApiProperty({
    example: 'PAUSADO',
    description: 'Nuevo estado del plan de lectura',
    enum: PlanStatusEnum,
    enumName: 'PlanStatusEnum'
  })
  @IsNotEmpty({ message: 'El estado del plan es requerido' })
  @IsEnum(PlanStatusEnum, { 
    message: 'Estado inválido. Debe ser: ACTIVO, COMPLETADO, PAUSADO o CANCELADO' 
  })
  estado: PlanStatusEnum;
}
