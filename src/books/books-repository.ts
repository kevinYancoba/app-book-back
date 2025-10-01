import { DatabaseService } from 'src/database/database.service';
import { PerilLecturaDto, perfilLectura } from './dto/perfil-lectura.dto';
import { Book, ReadinProfile, Prisma } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BooksRepository {
  private readonly logger = new Logger(BooksRepository.name);

  constructor(private readonly prisma: DatabaseService) {}

  async createPerfil(
    perfil: PerilLecturaDto,
  ): Promise<ReadinProfile | undefined> {
    try {
      this.logger.log(`Creando perfil de lectura para usuario ${perfil.idUsuario}`);

      // Convertir el enum string a su valor numérico
      const nivelLecturaNumerico = this.convertirNivelLectura(perfil.nivelLectura);
      console.log("LOG", perfil.nivelLectura)
      const newPerfil = await this.prisma.readinProfile.create({
        data: {
          user_id: perfil.idUsuario,
          nivel_lectura: nivelLecturaNumerico,
          tiempo_lectura_diario: perfil.tiempoLecturaDiario,
          hora_preferida: perfil.horaioLectura,
          incluir_fines_de_semana: perfil.finesSemana,
        },
      });

      this.logger.log(`Perfil de lectura creado exitosamente con ID: ${newPerfil.id_perfil} para usuario ${perfil.idUsuario}`);
      return newPerfil;
    } catch (error) {
      this.logger.error(`Error al crear perfil de lectura: ${error.message}`, error.stack);
      return undefined;
    }
  }

  private convertirNivelLectura(nivelLectura: perfilLectura): number {
    // El enum perfilLectura ya tiene los valores numéricos asignados
    return nivelLectura;
  }

  async createBook(perfil: PerilLecturaDto): Promise<Book | undefined> {
    try {
      this.logger.log(`Creando libro "${perfil.tituloLibro}" para usuario ${perfil.idUsuario}`);

      const newBook = await this.prisma.book.create({
        data: {
          titulo: perfil.tituloLibro.trim(),
          autor: perfil.autorLibro.trim(),
          imagen_indice: null,
          id: perfil.idUsuario,
          creado_por_ocr: true,
        },
      });

      this.logger.log(`Libro creado exitosamente con ID: ${newBook.id_libro}`);
      return newBook;
    } catch (error) {
      this.logger.error(`Error al crear libro: ${error.message}`, error.stack);
      return undefined;
    }
  }

  async createChapter(chapters: Prisma.ChapterCreateManyInput[]) {
    try {
      this.logger.log(`Creando ${chapters.length} capítulos`);

      if (chapters.length === 0) {
        this.logger.warn('No hay capítulos para crear');
        return { count: 0 };
      }

      const newChapter = await this.prisma.chapter.createMany({
        data: chapters,
        skipDuplicates: true, // Evitar errores por duplicados
      });

      this.logger.log(`${newChapter.count} capítulos creados exitosamente`);
      return newChapter;
    } catch (error) {
      this.logger.error(`Error al crear capítulos: ${error.message}`, error.stack);
      return undefined;
    }
  }

  async getChapters(idLibro: number) {
    try {
      this.logger.log(`Obteniendo capítulos para libro ${idLibro}`);

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
          numero_capitulo: 'asc', // Cambio a ascendente para orden lógico
        },
      });

      this.logger.log(`${chapters.length} capítulos encontrados para libro ${idLibro}`);
      return chapters;
    } catch (error) {
      this.logger.error(`Error al obtener capítulos: ${error.message}`, error.stack);
      return undefined;
    }
  }
}
