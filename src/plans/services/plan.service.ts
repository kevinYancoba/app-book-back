import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PlanRepository } from '../plan-repository';
import { BooksService } from 'src/books/services/books.service';
import { PerilLecturaDto } from 'src/books/dto/perfil-lectura.dto';

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
}
