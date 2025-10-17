import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PlanRepository } from '../plan-repository';
import { BooksService } from 'src/books/services/books.service';
import { PerilLecturaDto } from 'src/books/dto/perfil-lectura.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { PlanStatusEnum } from '../dto/plan-status.dto';
import {
  DailyProgressDto,
  UpdateProgressDto,
  MarkChapterReadDto,
  DayStatusEnum
} from '../dto/progress-tracking.dto';

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(
    private bookService: BooksService,
    private planRepository: PlanRepository,
  ) {}

  public async createPlan(perfil: PerilLecturaDto) {
    try {
      this.logger.log(`Iniciando creación de plan para usuario ${perfil.idUsuario}`);

      // Validaciones iniciales
      this.validatePlanInput(perfil);

      const { nivelLectura, fechaFin } = perfil;

      // Crear perfil y libro
      const result = await this.bookService.cretePerfil(perfil);
      if (!result || !result.book || !result.profile) {
        throw new HttpException(
          'Error al crear el libro y perfil',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const { book, profile } = result;

      // Obtener capítulos
      const chapters = await this.bookService.getChapters(book.id_libro);
      if (!chapters || chapters.length === 0) {
        throw new HttpException(
          'No se pudieron obtener los capítulos del libro',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calcular páginas totales
      const totalPages = chapters.reduce((sum, chapter) => {
        return sum + (chapter.paginas_estimadas || 0);
      }, 0);

      if (totalPages === 0) {
        throw new HttpException(
          'El libro no tiene páginas válidas para crear un plan',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calcular fechas y días disponibles
      const startDate = new Date();
      const endDate = new Date(fechaFin);

      if (endDate <= startDate) {
        throw new HttpException(
          'La fecha de finalización debe ser posterior a la fecha actual',
          HttpStatus.BAD_REQUEST,
        );
      }

      const daysAvailable = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
      );

      const pagesPerDayRequired = Math.ceil(totalPages / daysAvailable);

      let finalDays = daysAvailable;
      let pagesPerDay = pagesPerDayRequired;
      let adjustedPlan = false;

      // Ajustar plan si excede el nivel de lectura del usuario
      if (pagesPerDayRequired > nivelLectura) {
        finalDays = Math.ceil(totalPages / nivelLectura);
        pagesPerDay = nivelLectura;
        adjustedPlan = true;
        this.logger.warn(`Plan ajustado: de ${daysAvailable} a ${finalDays} días`);
      }

      // Crear el plan principal
      const finalEndDate = new Date(startDate.getTime() + finalDays * 24 * 3600 * 1000);
      const newPlan = await this.planRepository.createPlan(
        perfil.idUsuario,
        book.id_libro,
        finalEndDate,
        profile.id_perfil,
      );

      if (!newPlan) {
        throw new HttpException(
          'Error al crear el plan en la base de datos',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Generar detalles del plan
      await this.generatePlanDetails(
        newPlan.id_plan,
        chapters,
        startDate,
        finalDays,
        pagesPerDay,
        perfil,
      );

      this.logger.log(`Plan creado exitosamente con ID: ${newPlan.id_plan}`);

      return {
        mensaje: adjustedPlan
          ? `Plan ajustado automáticamente (de ${daysAvailable} a ${finalDays} días)`
          : 'Plan generado exitosamente',
        plan: newPlan,
        estadisticas: {
          totalPaginas: totalPages,
          diasPlanificados: finalDays,
          paginasPorDia: pagesPerDay,
          totalCapitulos: chapters.length,
        },
      };
    } catch (error) {
      this.logger.error(`Error al crear plan: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al crear el plan de lectura',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private validatePlanInput(perfil: PerilLecturaDto): void {
    if (!perfil.idUsuario || perfil.idUsuario <= 0) {
      throw new HttpException(
        'ID de usuario inválido',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!perfil.fechaFin) {
      throw new HttpException(
        'Fecha de finalización es requerida',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!perfil.nivelLectura || perfil.nivelLectura <= 0) {
      throw new HttpException(
        'Nivel de lectura inválido',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!perfil.tiempoLecturaDiario || perfil.tiempoLecturaDiario <= 0) {
      throw new HttpException(
        'Tiempo de lectura diario inválido',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async generatePlanDetails(
    planId: number,
    chapters: any[],
    startDate: Date,
    finalDays: number,
    pagesPerDay: number,
    perfil: PerilLecturaDto,
  ): Promise<void> {
    let currentPage = 1;
    let currentDate = new Date(startDate);
    let currentChapterIndex = 0;

    for (let day = 0; day < finalDays; day++) {
      // Saltar fines de semana si está configurado
      if (!perfil.finesSemana) {
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      let remainingPagesForDay = pagesPerDay;

      // Distribuir páginas entre capítulos para este día
      while (remainingPagesForDay > 0 && currentChapterIndex < chapters.length) {
        const currentChapter = chapters[currentChapterIndex];
        const chapterTotalPages = currentChapter.paginas_estimadas || 0;

        // Si ya terminamos este capítulo, pasar al siguiente
        if (currentPage > chapterTotalPages) {
          currentPage = 1;
          currentChapterIndex++;
          continue;
        }

        // Calcular páginas para este capítulo en este día
        const startPage = currentPage;
        const maxEndPage = Math.min(
          chapterTotalPages,
          currentPage + remainingPagesForDay - 1,
        );
        const endPage = maxEndPage;

        // Crear detalle del plan
        await this.planRepository.createPlanDetail({
          id_plan: planId,
          id_capitulo: currentChapter.id_capitulo,
          fecha_asignada: new Date(currentDate),
          tiempo_estimado_minutos: perfil.tiempoLecturaDiario,
          pagina_inicio: startPage,
          pagina_fin: endPage,
          day: day + 1,
        });

        // Actualizar contadores
        const pagesRead = endPage - startPage + 1;
        remainingPagesForDay -= pagesRead;
        currentPage = endPage + 1;

        // Si terminamos el capítulo, pasar al siguiente
        if (currentPage > chapterTotalPages) {
          currentPage = 1;
          currentChapterIndex++;
        }
      }

      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);

      // Si ya no hay más capítulos, terminar
      if (currentChapterIndex >= chapters.length) {
        break;
      }
    }
  }

  // Obtener planes de un usuario
  async getUserPlans(userId: number) {
    try {
      this.logger.log(`Obteniendo planes para usuario ${userId}`);

      if (!userId || userId <= 0) {
        throw new HttpException(
          'ID de usuario inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      const plans = await this.planRepository.findUserPlans(userId);

      if (!plans) {
        throw new HttpException(
          'Error al obtener los planes del usuario',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Calcular estadísticas para cada plan
      const plansWithStats = await Promise.all(
        plans.map(async (plan) => {
          const stats = await this.calculatePlanStatistics(plan.id_plan);
          return {
            ...plan,
            estadisticas: stats,
          };
        })
      );

      this.logger.log(`${plans.length} planes encontrados para usuario ${userId}`);
      return plansWithStats;

    } catch (error) {
      this.logger.error(`Error al obtener planes del usuario: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al obtener los planes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Obtener plan específico con detalles
  async getPlanDetails(planId: number, userId?: number) {
    try {
      this.logger.log(`Obteniendo detalles del plan ${planId}`);

      if (!planId || planId <= 0) {
        throw new HttpException(
          'ID de plan inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar propiedad si se proporciona userId
      if (userId) {
        const isOwner = await this.planRepository.verifyPlanOwnership(planId, userId);
        if (!isOwner) {
          throw new HttpException(
            'No tienes permisos para acceder a este plan',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      const plan = await this.planRepository.findPlanWithDetails(planId);

      if (!plan) {
        throw new HttpException(
          'Plan no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }

      // Calcular estadísticas del plan
      const stats = await this.calculatePlanStatistics(planId);

      this.logger.log(`Detalles del plan ${planId} obtenidos exitosamente`);
      return {
        ...plan,
        estadisticas: stats,
      };

    } catch (error) {
      this.logger.error(`Error al obtener detalles del plan: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al obtener los detalles del plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Actualizar plan
  async updatePlan(planId: number, updateData: UpdatePlanDto, userId?: number) {
    try {
      this.logger.log(`Actualizando plan ${planId}`);

      if (!planId || planId <= 0) {
        throw new HttpException(
          'ID de plan inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar propiedad si se proporciona userId
      if (userId) {
        const isOwner = await this.planRepository.verifyPlanOwnership(planId, userId);
        if (!isOwner) {
          throw new HttpException(
            'No tienes permisos para modificar este plan',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      // Obtener plan actual con todos sus detalles
      const currentPlan = await this.planRepository.findPlanWithDetails(planId);
      if (!currentPlan) {
        throw new HttpException(
          'Plan no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }

      // Validar que el plan no esté completado
      if (currentPlan.estado === 'COMPLETADO') {
        throw new HttpException(
          'No se puede modificar un plan completado',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar datos de actualización
      this.validateUpdateData(updateData, currentPlan);

      // Detectar si hay cambios críticos que requieren regenerar detalles
      const criticalChanges = this.detectCriticalChanges(updateData, currentPlan);

      // Si nivelLectura está presente, convertirlo a paginasPorDia
      if (updateData.nivelLectura !== undefined) {
        updateData.paginasPorDia = updateData.nivelLectura;
        this.logger.log(`Nivel de lectura convertido a ${updateData.paginasPorDia} páginas por día`);
      }

      // Determinar si se debe regenerar (por defecto true si hay cambios críticos)
      const shouldRegenerate = updateData.regenerarDetalles !== false && criticalChanges;

      if (shouldRegenerate && criticalChanges) {
        this.logger.warn(`Cambios críticos detectados. Regenerando detalles del plan ${planId}`);

        // Regenerar plan completo
        const result = await this.regeneratePlanDetails(
          planId,
          currentPlan,
          updateData,
        );

        return result;
      } else {
        // Solo actualizar campos del plan sin regenerar detalles
        this.logger.log(`Actualizando solo metadata del plan ${planId}`);

        const updatedPlan = await this.planRepository.updatePlan(planId, updateData);

        if (!updatedPlan) {
          throw new HttpException(
            'Error al actualizar el plan',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        // Actualizar perfil de lectura si es necesario
        if (currentPlan.id_perfil && (updateData.nivelLectura || updateData.horaPreferida)) {
          await this.updateAssociatedProfile(currentPlan.id_perfil, updateData);
        }

        this.logger.log(`Plan ${planId} actualizado exitosamente`);
        return {
          mensaje: 'Plan actualizado exitosamente',
          plan: updatedPlan,
          cambiosCriticos: false,
        };
      }

    } catch (error) {
      this.logger.error(`Error al actualizar plan: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al actualizar el plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Cambiar estado del plan
  async updatePlanStatus(planId: number, status: PlanStatusEnum, userId?: number) {
    try {
      this.logger.log(`Cambiando estado del plan ${planId} a ${status}`);

      if (!planId || planId <= 0) {
        throw new HttpException(
          'ID de plan inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar propiedad si se proporciona userId
      if (userId) {
        const isOwner = await this.planRepository.verifyPlanOwnership(planId, userId);
        if (!isOwner) {
          throw new HttpException(
            'No tienes permisos para modificar este plan',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      const updatedPlan = await this.planRepository.updatePlanStatus(planId, status);

      if (!updatedPlan) {
        throw new HttpException(
          'Error al cambiar el estado del plan',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(`Estado del plan ${planId} cambiado a ${status}`);
      return updatedPlan;

    } catch (error) {
      this.logger.error(`Error al cambiar estado del plan: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al cambiar el estado del plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Eliminar plan
  async deletePlan(planId: number, userId?: number) {
    try {
      this.logger.log(`Eliminando plan ${planId}`);

      if (!planId || planId <= 0) {
        throw new HttpException(
          'ID de plan inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar propiedad si se proporciona userId
      if (userId) {
        const isOwner = await this.planRepository.verifyPlanOwnership(planId, userId);
        if (!isOwner) {
          throw new HttpException(
            'No tienes permisos para eliminar este plan',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      const deletedPlan = await this.planRepository.deletePlan(planId);

      if (!deletedPlan) {
        throw new HttpException(
          'Error al eliminar el plan',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(`Plan ${planId} eliminado exitosamente`);
      return { mensaje: 'Plan eliminado exitosamente', plan: deletedPlan };

    } catch (error) {
      this.logger.error(`Error al eliminar plan: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al eliminar el plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Métodos auxiliares privados
  private validateUpdateData(updateData: UpdatePlanDto, currentPlan?: any): void {
    if (updateData.fechaFin) {
      const now = new Date();
      if (updateData.fechaFin <= now) {
        throw new HttpException(
          'La fecha de finalización debe ser posterior a la fecha actual',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar que la nueva fecha no sea anterior a la fecha de inicio
      if (currentPlan && updateData.fechaFin < currentPlan.fecha_inicio) {
        throw new HttpException(
          'La fecha de finalización no puede ser anterior a la fecha de inicio del plan',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (updateData.paginasPorDia && updateData.paginasPorDia <= 0) {
      throw new HttpException(
        'Las páginas por día deben ser mayor a 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (updateData.tiempoEstimadoDia && updateData.tiempoEstimadoDia <= 0) {
      throw new HttpException(
        'El tiempo estimado por día debe ser mayor a 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (updateData.nivelLectura && updateData.nivelLectura <= 0) {
      throw new HttpException(
        'El nivel de lectura debe ser mayor a 0',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Detectar si hay cambios críticos que requieren regenerar detalles
  private detectCriticalChanges(updateData: UpdatePlanDto, currentPlan: any): boolean {
    const criticalFields: string[] = [];

    if (updateData.fechaFin &&
        updateData.fechaFin.getTime() !== new Date(currentPlan.fecha_fin).getTime()) {
      criticalFields.push('fechaFin');
    }

    if (updateData.paginasPorDia &&
        updateData.paginasPorDia !== currentPlan.paginas_por_dia) {
      criticalFields.push('paginasPorDia');
    }

    if (updateData.nivelLectura &&
        updateData.nivelLectura !== currentPlan.paginas_por_dia) {
      criticalFields.push('nivelLectura');
    }

    if (updateData.incluirFinesSemana !== undefined &&
        updateData.incluirFinesSemana !== currentPlan.incluir_fines_semana) {
      criticalFields.push('incluirFinesSemana');
    }

    if (updateData.tiempoEstimadoDia &&
        updateData.tiempoEstimadoDia !== currentPlan.tiempo_estimado_dia) {
      criticalFields.push('tiempoEstimadoDia');
    }

    if (criticalFields.length > 0) {
      this.logger.log(`Campos críticos modificados: ${criticalFields.join(', ')}`);
      return true;
    }

    return false;
  }

  // Regenerar detalles del plan cuando hay cambios críticos
  private async regeneratePlanDetails(
    planId: number,
    currentPlan: any,
    updateData: UpdatePlanDto,
  ) {
    try {
      this.logger.log(`Iniciando regeneración de detalles para plan ${planId}`);

      // Verificar si hay progreso registrado
      const progressRecords = await this.planRepository.getProgressHistory(planId);
      const hasProgress = progressRecords && progressRecords.length > 0;

      if (hasProgress) {
        this.logger.warn(`Plan ${planId} tiene progreso registrado. Preservando días completados.`);
      }

      // Obtener capítulos del libro
      const chapters = await this.bookService.getChapters(currentPlan.id_libro);
      if (!chapters || chapters.length === 0) {
        throw new HttpException(
          'No se pudieron obtener los capítulos del libro',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calcular páginas totales
      const totalPages = chapters.reduce((sum, chapter) => {
        return sum + (chapter.paginas_estimadas || 0);
      }, 0);

      // Determinar parámetros finales
      const startDate = new Date(currentPlan.fecha_inicio);
      const endDate = updateData.fechaFin || new Date(currentPlan.fecha_fin);
      const pagesPerDay = updateData.paginasPorDia ||
                          updateData.nivelLectura ||
                          currentPlan.paginas_por_dia || 10;
      const includeWeekends = updateData.incluirFinesSemana !== undefined
                              ? updateData.incluirFinesSemana
                              : currentPlan.incluir_fines_semana;
      const dailyTime = updateData.tiempoEstimadoDia ||
                        currentPlan.tiempo_estimado_dia || 30;

      // Calcular días disponibles
      const daysAvailable = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
      );

      const pagesPerDayRequired = Math.ceil(totalPages / daysAvailable);

      let finalDays = daysAvailable;
      let finalPagesPerDay = pagesPerDay;
      let adjustedPlan = false;

      // Ajustar plan si excede la capacidad
      if (pagesPerDayRequired > pagesPerDay) {
        finalDays = Math.ceil(totalPages / pagesPerDay);
        finalPagesPerDay = pagesPerDay;
        adjustedPlan = true;
        this.logger.warn(`Plan ajustado: de ${daysAvailable} a ${finalDays} días`);
      }

      // Eliminar detalles existentes no completados
      const uncompletedDetails = await this.planRepository.getUncompletedPlanDetails(planId);
      if (uncompletedDetails && uncompletedDetails.length > 0) {
        await this.planRepository.deletePlanDetails(planId);
        this.logger.log(`${uncompletedDetails.length} detalles no completados eliminados`);
      }

      // Actualizar el plan principal
      const finalEndDate = new Date(startDate.getTime() + finalDays * 24 * 3600 * 1000);
      const planUpdateData: UpdatePlanDto = {
        ...updateData,
        fechaFin: adjustedPlan ? finalEndDate : endDate,
        paginasPorDia: finalPagesPerDay,
        tiempoEstimadoDia: dailyTime,
        incluirFinesSemana: includeWeekends,
      };

      const updatedPlan = await this.planRepository.updatePlan(planId, planUpdateData);

      if (!updatedPlan) {
        throw new HttpException(
          'Error al actualizar el plan',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Generar nuevos detalles
      await this.generatePlanDetails(
        planId,
        chapters,
        startDate,
        finalDays,
        finalPagesPerDay,
        {
          finesSemana: includeWeekends,
          tiempoLecturaDiario: dailyTime,
        } as any,
      );

      // Actualizar perfil de lectura si existe
      if (currentPlan.id_perfil) {
        await this.updateAssociatedProfile(currentPlan.id_perfil, updateData);
      }

      this.logger.log(`Plan ${planId} regenerado exitosamente`);

      return {
        mensaje: adjustedPlan
          ? `Plan regenerado y ajustado automáticamente (de ${daysAvailable} a ${finalDays} días)`
          : 'Plan regenerado exitosamente',
        plan: updatedPlan,
        cambiosCriticos: true,
        ajustado: adjustedPlan,
        estadisticas: {
          totalPaginas: totalPages,
          diasPlanificados: finalDays,
          paginasPorDia: finalPagesPerDay,
          totalCapitulos: chapters.length,
        },
      };

    } catch (error) {
      this.logger.error(`Error al regenerar detalles del plan: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error al regenerar los detalles del plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Actualizar perfil de lectura asociado
  private async updateAssociatedProfile(profileId: number, updateData: UpdatePlanDto) {
    try {
      const profileUpdateData: any = {};

      if (updateData.nivelLectura !== undefined) {
        profileUpdateData.nivel_lectura = updateData.nivelLectura;
      }

      if (updateData.tiempoEstimadoDia !== undefined) {
        profileUpdateData.tiempo_lectura_diario = updateData.tiempoEstimadoDia;
      }

      if (updateData.horaPreferida !== undefined) {
        profileUpdateData.hora_preferida = updateData.horaPreferida;
      }

      if (updateData.incluirFinesSemana !== undefined) {
        profileUpdateData.incluir_fines_de_semana = updateData.incluirFinesSemana;
      }

      if (Object.keys(profileUpdateData).length > 0) {
        await this.planRepository.updateReadingProfile(profileId, profileUpdateData);
        this.logger.log(`Perfil de lectura ${profileId} actualizado`);
      }
    } catch (error) {
      this.logger.warn(`No se pudo actualizar el perfil de lectura: ${error.message}`);
      // No lanzar error, es una operación secundaria
    }
  }

  private async calculatePlanStatistics(planId: number) {
    try {
      // Obtener detalles del plan
      const planDetails = await this.planRepository.findPlanWithDetails(planId);

      if (!planDetails) {
        return null;
      }

      const totalCapitulos = planDetails.detalleplanlectura.length;
      const capitulosCompletados = planDetails.detalleplanlectura.filter(d => d.leido).length;

      const totalPaginas = planDetails.detalleplanlectura.reduce((sum, detail) => {
        const inicio = detail.pagina_inicio || 0;
        const fin = detail.pagina_fin || 0;
        return sum + Math.max(0, fin - inicio + 1);
      }, 0);

      const paginasLeidas = planDetails.detalleplanlectura
        .filter(d => d.leido)
        .reduce((sum, detail) => {
          const inicio = detail.pagina_inicio || 0;
          const fin = detail.pagina_fin || 0;
          return sum + Math.max(0, fin - inicio + 1);
        }, 0);

      const fechaInicio = new Date(planDetails.fecha_inicio);
      const fechaFin = new Date(planDetails.fecha_fin);
      const ahora = new Date();

      const diasTotales = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
      const diasTranscurridos = Math.ceil((ahora.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24));
      const diasRestantes = Math.max(0, diasTotales - diasTranscurridos);

      return {
        totalCapitulos,
        capitulosCompletados,
        totalPaginas,
        paginasLeidas,
        diasTranscurridos: Math.max(0, diasTranscurridos),
        diasRestantes,
      };
    } catch (error) {
      this.logger.error(`Error al calcular estadísticas: ${error.message}`, error.stack);
      return null;
    }
  }

  // ==================== MÉTODOS DE TRACKING DE PROGRESO ====================

  // Registrar progreso diario
  async registerDailyProgress(progressData: DailyProgressDto, userId?: number) {
    try {
      this.logger.log(`Registrando progreso diario para plan ${progressData.planId}`);

      // Validar datos de entrada
      this.validateProgressData(progressData);

      // Verificar propiedad del plan si se proporciona userId
      if (userId) {
        const isOwner = await this.planRepository.verifyPlanOwnership(progressData.planId, userId);
        if (!isOwner) {
          throw new HttpException(
            'No tienes permisos para registrar progreso en este plan',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      // Registrar progreso
      const progress = await this.planRepository.createOrUpdateDailyProgress(progressData);

      if (!progress) {
        throw new HttpException(
          'Error al registrar el progreso diario',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Actualizar progreso del plan si hay capítulos leídos
      if (progressData.capitulosLeidos && progressData.capitulosLeidos.length > 0) {
        await this.updatePlanProgressPercentage(progressData.planId);
      }

      this.logger.log(`Progreso diario registrado exitosamente para plan ${progressData.planId}`);
      return {
        mensaje: 'Progreso registrado exitosamente',
        progreso: progress,
      };

    } catch (error) {
      this.logger.error(`Error al registrar progreso diario: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al registrar el progreso',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Obtener historial de progreso
  async getProgressHistory(planId: number, userId?: number, limit?: number) {
    try {
      this.logger.log(`Obteniendo historial de progreso para plan ${planId}`);

      if (!planId || planId <= 0) {
        throw new HttpException(
          'ID de plan inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar propiedad si se proporciona userId
      if (userId) {
        const isOwner = await this.planRepository.verifyPlanOwnership(planId, userId);
        if (!isOwner) {
          throw new HttpException(
            'No tienes permisos para ver el progreso de este plan',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      const progress = await this.planRepository.getProgressHistory(planId, limit);

      if (!progress) {
        throw new HttpException(
          'Error al obtener el historial de progreso',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Calcular estadísticas del historial
      const estadisticas = this.calculateHistoryStatistics(progress);

      this.logger.log(`Historial de progreso obtenido para plan ${planId}`);
      return {
        progreso: progress,
        estadisticas,
      };

    } catch (error) {
      this.logger.error(`Error al obtener historial de progreso: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al obtener el historial',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Actualizar progreso específico
  async updateSpecificProgress(progressId: number, updateData: UpdateProgressDto, userId?: number) {
    try {
      this.logger.log(`Actualizando progreso específico ${progressId}`);

      if (!progressId || progressId <= 0) {
        throw new HttpException(
          'ID de progreso inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar datos de actualización
      this.validateUpdateProgressData(updateData);

      const updatedProgress = await this.planRepository.updateProgress(progressId, updateData);

      if (!updatedProgress) {
        throw new HttpException(
          'Error al actualizar el progreso o progreso no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`Progreso ${progressId} actualizado exitosamente`);
      return {
        mensaje: 'Progreso actualizado exitosamente',
        progreso: updatedProgress,
      };

    } catch (error) {
      this.logger.error(`Error al actualizar progreso: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al actualizar el progreso',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Marcar capítulos como leídos
  async markChaptersAsRead(planId: number, markData: MarkChapterReadDto, userId?: number) {
    try {
      this.logger.log(`Marcando capítulos como leídos en plan ${planId}`);

      if (!planId || planId <= 0) {
        throw new HttpException(
          'ID de plan inválido',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar propiedad si se proporciona userId
      if (userId) {
        const isOwner = await this.planRepository.verifyPlanOwnership(planId, userId);
        if (!isOwner) {
          throw new HttpException(
            'No tienes permisos para modificar este plan',
            HttpStatus.FORBIDDEN,
          );
        }
      }

      // Marcar capítulos como leídos
      const result = await this.planRepository.markChaptersAsRead(
        markData.detalleIds,
        markData.tiempoRealMinutos,
        markData.dificultadPercibida,
        markData.notas
      );

      if (!result) {
        throw new HttpException(
          'Error al marcar capítulos como leídos',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Actualizar porcentaje de progreso del plan
      const newProgress = await this.updatePlanProgressPercentage(planId);

      this.logger.log(`${result.count} capítulos marcados como leídos en plan ${planId}`);
      return {
        mensaje: 'Capítulos marcados como leídos exitosamente',
        capitulosMarcados: result.count,
        nuevoProgreso: newProgress,
        detallesActualizados: markData.detalleIds.map(id => ({
          id_detalle: id,
          leido: true,
          fecha_completado: new Date(),
          tiempo_real_minutos: markData.tiempoRealMinutos,
          notas: markData.notas,
        })),
      };

    } catch (error) {
      this.logger.error(`Error al marcar capítulos como leídos: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al marcar capítulos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==================== FUNCIONES AUXILIARES DE PROGRESO ====================

  // Validar datos de progreso diario
  private validateProgressData(progressData: DailyProgressDto): void {
    const now = new Date();
    const progressDate = new Date(progressData.fecha);

    // No permitir fechas futuras muy lejanas (más de 1 día)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (progressDate > tomorrow) {
      throw new HttpException(
        'No se puede registrar progreso para fechas futuras',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar que si hay capítulos leídos, también haya páginas o tiempo
    if (progressData.capitulosLeidos && progressData.capitulosLeidos.length > 0) {
      if (!progressData.paginasLeidas && !progressData.tiempoInvertidoMin) {
        throw new HttpException(
          'Debe especificar páginas leídas o tiempo invertido al marcar capítulos como leídos',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validar consistencia entre estado y porcentaje
    if (progressData.estadoDia === DayStatusEnum.COMPLETADO && progressData.porcentajeDia && progressData.porcentajeDia < 100) {
      throw new HttpException(
        'Un día completado debe tener 100% de progreso',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Validar datos de actualización de progreso
  private validateUpdateProgressData(updateData: UpdateProgressDto): void {
    // Validar consistencia entre estado y porcentaje
    if (updateData.estadoDia === DayStatusEnum.COMPLETADO && updateData.porcentajeDia && updateData.porcentajeDia < 100) {
      throw new HttpException(
        'Un día completado debe tener 100% de progreso',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar que al menos un campo esté presente
    const hasValidField = updateData.paginasLeidas !== undefined ||
                         updateData.tiempoInvertidoMin !== undefined ||
                         updateData.estadoDia !== undefined ||
                         updateData.porcentajeDia !== undefined ||
                         updateData.notasDia !== undefined;

    if (!hasValidField) {
      throw new HttpException(
        'Debe proporcionar al menos un campo para actualizar',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Actualizar porcentaje de progreso del plan
  private async updatePlanProgressPercentage(planId: number): Promise<number> {
    try {
      const stats = await this.planRepository.calculateProgressStats(planId);

      if (!stats) {
        return 0;
      }

      // Actualizar el porcentaje en el plan
      await this.planRepository.updatePlan(planId, {
        // Solo actualizar el progreso, no otros campos
      } as UpdatePlanDto);

      // Actualizar directamente el campo de progreso en la base de datos
      await this.planRepository['prisma'].readingPlan.update({
        where: { id_plan: planId },
        data: { progreso_porcentaje: stats.progressPercentage },
      });

      return stats.progressPercentage;
    } catch (error) {
      this.logger.error(`Error al actualizar porcentaje de progreso: ${error.message}`, error.stack);
      return 0;
    }
  }

  // Calcular estadísticas del historial
  private calculateHistoryStatistics(progress: any[]): any {
    if (!progress || progress.length === 0) {
      return {
        totalDias: 0,
        diasCompletados: 0,
        diasParciales: 0,
        diasAtrasados: 0,
        promedioTiempoDiario: 0,
        promedioPaginasDiarias: 0,
        rachaActual: 0,
        mejorRacha: 0,
      };
    }

    const totalDias = progress.length;
    const diasCompletados = progress.filter(p => p.completado).length;
    const diasParciales = progress.filter(p => p.estado_dia === DayStatusEnum.PARCIAL).length;
    const diasAtrasados = progress.filter(p => p.estado_dia === DayStatusEnum.ATRASADO).length;

    const promedioTiempoDiario = progress.reduce((sum, p) => sum + (p.tiempo_invertido_min || 0), 0) / totalDias;
    const promedioPaginasDiarias = progress.reduce((sum, p) => sum + (p.paginas_leidas || 0), 0) / totalDias;

    // Calcular racha actual (días completados consecutivos desde el final)
    let rachaActual = 0;
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i].completado) {
        rachaActual++;
      } else {
        break;
      }
    }

    // Calcular mejor racha
    let mejorRacha = 0;
    let rachaTemp = 0;
    for (const p of progress) {
      if (p.completado) {
        rachaTemp++;
        mejorRacha = Math.max(mejorRacha, rachaTemp);
      } else {
        rachaTemp = 0;
      }
    }

    return {
      totalDias,
      diasCompletados,
      diasParciales,
      diasAtrasados,
      promedioTiempoDiario: Math.round(promedioTiempoDiario * 100) / 100,
      promedioPaginasDiarias: Math.round(promedioPaginasDiarias * 100) / 100,
      rachaActual,
      mejorRacha,
    };
  }
}
