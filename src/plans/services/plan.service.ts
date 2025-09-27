import { Injectable } from '@nestjs/common';
import { PlanRepository } from '../plan-repository';
import { BooksService } from 'src/books/services/books.service';
import { PerilLecturaDto } from 'src/books/dto/perfil-lectura.dto';

@Injectable()
export class PlanService {
  constructor(
    private bookService: BooksService,
    private planRepository: PlanRepository,
  ) {}

  public async createPlan(perfil: PerilLecturaDto) {
    const { nivelLectura, fechaFin } = perfil;

    const book = await this.bookService.cretePerfil(perfil);

    const chapters = await this.bookService.getChapters(book.id_libro);
    if (!chapters) throw new Error('error al crear el libro');

    const totalPages = chapters?.reduce((sum, chapter) => {
      return sum + (chapter.paginas_estimadas || 0);
    }, 0);

    const startDate = new Date();
    const daysAvailable = Math.ceil(
      (fechaFin.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
    );

    const pagesPerDayrequired = Math.ceil((totalPages ?? 1) / daysAvailable);

    let finalDays = daysAvailable;
    let pagesPerDay = pagesPerDayrequired;
    let adjustedPlan = false;

    if (pagesPerDayrequired > nivelLectura) {
      finalDays = Math.ceil(totalPages / nivelLectura);
      pagesPerDay = nivelLectura;
      adjustedPlan = true;
    }

    const newPlan = await this.planRepository.createPlan(
      perfil.idUsuario,
      book.id_libro,
      new Date(startDate.getTime() + finalDays * 24 * 3600 * 1000),
    );

    if (!newPlan) throw new Error('error al crear el plan');

    let currentPage = 1;
    let currentDate = startDate;

    for (let day = 0; day < finalDays; day++) {
      if (!perfil.finesSemana) {
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
  
      let remainingPage = pagesPerDay;

      for (const chapter of chapters) {
        let page = chapter.paginas_estimadas ?? 0;
        if (currentPage > page) {
          currentPage = 1;
          continue;
        }
        const initPage = currentPage;
        const endPage = Math.min(page, currentPage + remainingPage - 1);

        await this.planRepository.createPlanDetail({
          id_plan: newPlan.id_plan,
          id_capitulo: chapter.id_capitulo,
          fecha_asignada: currentDate,
          tiempo_estimado_minutos: perfil.tiempoLecturaDiario,
          pagina_inicio: initPage,
          pagina_fin: endPage,
          day,
        });

        remainingPage -= initPage - endPage + 1;
        currentPage = endPage + 1;

        if (remainingPage <= 0) break;
      }
      currentDate.setDate(currentDate.getDate() + 1);

    }
    return {
    mensaje: adjustedPlan
      ? `Plan ajustado automáticamente (de ${daysAvailable} a ${finalDays} días)`
      : 'Plan generado exitosamente',
    newPlan,
  };
  }
}
