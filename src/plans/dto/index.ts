// Exportar todos los DTOs del módulo de planes
export * from './update-plan.dto';
export * from './plan-status.dto';
export * from './plan-response.dto';
export * from './plan-detail-response.dto';
export * from './progress-tracking.dto';
export * from './progress-response.dto';

// Re-exportar tipos específicos para facilitar importación
export { UpdatePlanDto } from './update-plan.dto';
export { UpdatePlanStatusDto, PlanStatusEnum } from './plan-status.dto';
export { PlanResponseDto } from './plan-response.dto';
export { PlanDetailResponseDto, PlanDetailItemDto } from './plan-detail-response.dto';
export {
  DailyProgressDto,
  UpdateProgressDto,
  MarkChapterReadDto,
  DayStatusEnum
} from './progress-tracking.dto';
export {
  ProgressResponseDto,
  ProgressHistoryDto,
  ProgressDashboardDto,
  ChapterMarkResponseDto
} from './progress-response.dto';
