import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  UseInterceptors
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PlanService } from './services/plan.service';
import { TransformDtoInterceptor } from 'src/shared/interceptors/transform-dto.interceptor';
import { PerilLecturaDto } from 'src/books/dto/perfil-lectura.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdatePlanStatusDto } from './dto/plan-status.dto';
import { PlanResponseDto, PlanDetailResponseDto } from './dto';
import {
  DailyProgressDto,
  UpdateProgressDto,
  MarkChapterReadDto
} from './dto/progress-tracking.dto';
import {
  ProgressResponseDto,
  ProgressHistoryDto,
  ChapterMarkResponseDto
} from './dto/progress-response.dto';

@ApiTags('Plans')
@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post('createPlan')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear nuevo plan de lectura',
    description: 'Crea un nuevo plan de lectura basado en el perfil del usuario y el libro seleccionado'
  })
  @ApiResponse({
    status: 201,
    description: 'Plan creado exitosamente',
    type: PlanResponseDto
  })
  @UseInterceptors(new TransformDtoInterceptor())
  async createPlan(@Body() perfil: PerilLecturaDto): Promise<any> {
    return await this.planService.createPlan(perfil);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener planes de un usuario',
    description: 'Obtiene todos los planes de lectura de un usuario específico'
  })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Planes obtenidos exitosamente',
    type: [PlanResponseDto]
  })
  async getUserPlans(@Param('userId', ParseIntPipe) userId: number): Promise<any> {
    return await this.planService.getUserPlans(userId);
  }

  @Get(':planId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener detalles de un plan',
    description: 'Obtiene los detalles completos de un plan de lectura específico'
  })
  @ApiParam({ name: 'planId', description: 'ID del plan', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Detalles del plan obtenidos exitosamente',
    type: PlanDetailResponseDto
  })
  async getPlanDetails(@Param('planId', ParseIntPipe) planId: number): Promise<any> {
    return await this.planService.getPlanDetails(planId);
  }

  @Put(':planId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar plan de lectura',
    description: 'Actualiza los datos de un plan de lectura existente'
  })
  @ApiParam({ name: 'planId', description: 'ID del plan', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Plan actualizado exitosamente',
    type: PlanResponseDto
  })
  @UseInterceptors(new TransformDtoInterceptor())
  async updatePlan(
    @Param('planId', ParseIntPipe) planId: number,
    @Body() updateData: UpdatePlanDto
  ): Promise<any> {
    return await this.planService.updatePlan(planId, updateData);
  }

  @Patch(':planId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar estado del plan',
    description: 'Cambia el estado de un plan de lectura (ACTIVO, PAUSADO, COMPLETADO, CANCELADO)'
  })
  @ApiParam({ name: 'planId', description: 'ID del plan', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Estado del plan cambiado exitosamente',
    type: PlanResponseDto
  })
  @UseInterceptors(new TransformDtoInterceptor())
  async updatePlanStatus(
    @Param('planId', ParseIntPipe) planId: number,
    @Body() statusData: UpdatePlanStatusDto
  ): Promise<any> {
    return await this.planService.updatePlanStatus(planId, statusData.estado);
  }

  @Delete(':planId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar plan de lectura',
    description: 'Elimina un plan de lectura y todos sus datos asociados'
  })
  @ApiParam({ name: 'planId', description: 'ID del plan', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Plan eliminado exitosamente'
  })
  async deletePlan(@Param('planId', ParseIntPipe) planId: number): Promise<any> {
    return await this.planService.deletePlan(planId);
  }

  // ==================== ENDPOINTS DE TRACKING DE PROGRESO ====================

  @Post('progress/daily')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar progreso diario',
    description: 'Registra el progreso de lectura de un día específico'
  })
  @ApiResponse({
    status: 201,
    description: 'Progreso registrado exitosamente',
    type: ProgressResponseDto
  })
  @UseInterceptors(new TransformDtoInterceptor())
  async registerDailyProgress(@Body() progressData: DailyProgressDto): Promise<any> {
    return await this.planService.registerDailyProgress(progressData);
  }

  @Get(':planId/progress/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener historial de progreso',
    description: 'Obtiene el historial completo de progreso de un plan con estadísticas'
  })
  @ApiParam({ name: 'planId', description: 'ID del plan', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Historial obtenido exitosamente',
    type: ProgressHistoryDto
  })
  async getProgressHistory(@Param('planId', ParseIntPipe) planId: number): Promise<any> {
    return await this.planService.getProgressHistory(planId);
  }

  @Put('progress/:progressId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar progreso específico',
    description: 'Actualiza un registro de progreso específico'
  })
  @ApiParam({ name: 'progressId', description: 'ID del progreso', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Progreso actualizado exitosamente',
    type: ProgressResponseDto
  })
  @UseInterceptors(new TransformDtoInterceptor())
  async updateProgress(
    @Param('progressId', ParseIntPipe) progressId: number,
    @Body() updateData: UpdateProgressDto
  ): Promise<any> {
    return await this.planService.updateSpecificProgress(progressId, updateData);
  }

  @Post(':planId/chapters/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar capítulos como leídos',
    description: 'Marca uno o más capítulos como completados y actualiza el progreso del plan'
  })
  @ApiParam({ name: 'planId', description: 'ID del plan', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Capítulos marcados exitosamente',
    type: ChapterMarkResponseDto
  })
  @UseInterceptors(new TransformDtoInterceptor())
  async markChaptersAsRead(
    @Param('planId', ParseIntPipe) planId: number,
    @Body() markData: MarkChapterReadDto
  ): Promise<any> {
    return await this.planService.markChaptersAsRead(planId, markData);
  }
}
