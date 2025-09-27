import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PlanRepository } from '../plan-repository';
import { BooksService } from 'src/books/services/books.service';
import { PerilLecturaDto } from 'src/books/dto/perfil-lectura.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { PlanStatusEnum } from '../dto/plan-status.dto';

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
      const book = await this.bookService.cretePerfil(perfil);
      if (!book) {
        throw new HttpException(
          'Error al crear el libro',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

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

      // Validar datos de actualización
      this.validateUpdateData(updateData);

      const updatedPlan = await this.planRepository.updatePlan(planId, updateData);

      if (!updatedPlan) {
        throw new HttpException(
          'Error al actualizar el plan',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(`Plan ${planId} actualizado exitosamente`);
      return updatedPlan;

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
  private validateUpdateData(updateData: UpdatePlanDto): void {
    if (updateData.fechaFin) {
      const now = new Date();
      if (updateData.fechaFin <= now) {
        throw new HttpException(
          'La fecha de finalización debe ser posterior a la fecha actual',
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
}
