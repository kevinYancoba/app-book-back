import { DatabaseService } from 'src/database/database.service';
import { PerilLecturaDto } from './dto/perfil-lectura.dto';
import { Book, ReadinProfile, Prisma } from '@prisma/client';

export class BooksRepository {
  constructor(private readonly prisma: DatabaseService) {}

  async createPerfil(
    perfil: PerilLecturaDto,
  ): Promise<ReadinProfile | undefined> {
    try {
      const newPerfil = await this.prisma.readinProfile.create({
        data: {
          id: perfil.idUsuario,
          nivel_lectura: perfil.nivelLectura,
          tiempo_lectura_diario: perfil.tiempoLecturaDiario,
          hora_preferida: perfil.horaioLectura,
          incluir_fines_de_semana: perfil.finesSemana,
        },
      });

      return newPerfil;
    } catch (error) {
      return undefined;
    }
  }

  async createBook(pefil: PerilLecturaDto): Promise<Book | undefined> {
    try {
      const newBook = await this.prisma.book.create({
        data: {
          titulo: pefil.tituloLibro,
          autor: pefil.autorLibro,
          imagen_indice: null,
          id: pefil.idUsuario,
          creado_por_ocr: true,
        },
      });
      return newBook;
    } catch (error) {
      return undefined;
    }
  }

  async createChapter(chapters: Prisma.ChapterCreateManyInput[]) {
    try {
      const newChapter = await this.prisma.chapter.createMany({
        data: chapters,
      });

      return newChapter;
    } catch (error) {
      return undefined;
    }
  }

  async getChapters(idLibro: number) {
    try {
      const chapters = await this.prisma.chapter.findMany({
        select: {
          id_capitulo: true,
          titulo_capitulo: true,
          numero_capitulo: true,
          paginas_estimadas: true,
        },
        where: {
          id_libro: idLibro,
        },
        orderBy: {
          numero_capitulo: 'desc',
        },
      });

      if (!chapters) return undefined;
      return chapters;
    } catch (error) {
      return undefined;
    }
  }
}
