// Exportar todos los DTOs del módulo de reportes
export * from './dashboard.dto';
export * from './dashboard-response.dto';

// Re-exportar tipos específicos para facilitar importación
export { 
  DashboardFiltersDto,
  DashboardMetricsDto,
  TrendAnalysisDto,
  PerformanceAnalysisDto,
  AlertsRecommendationsDto,
  PeriodTypeEnum
} from './dashboard.dto';

export { 
  CompleteDashboardDto,
  QuickDashboardDto,
  ComparativeAnalysisDto,
  ExportableReportDto,
  RealTimeMetricsDto
} from './dashboard-response.dto';
