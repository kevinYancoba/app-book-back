import { BooksRepository } from './../books-repository';
import { PerilLecturaDto } from '../dto/perfil-lectura.dto';
import { OpeniaService } from './openia.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { cretePromtAi } from '../context-ai/prompt-ai';
import { Prisma } from '@prisma/client';

@Injectable()
export class BooksService {
  [x: string]: any;
  constructor(
    private openIaService: OpeniaService,
    private bookRepository: BooksRepository,
  ) {}

  async cretePerfil(perfil: PerilLecturaDto) {
    try {
      const newPerfil = await this.bookRepository.createPerfil(perfil);
      if (!newPerfil) {
        throw new HttpException(
          'parametros no valididos, pefil invalido',
          HttpStatus.BAD_REQUEST,
        );
      }

      const newBook = await this.bookRepository.createBook(perfil);
      if (!newBook) {
        throw new HttpException(
          'parametros de libro no validos',
          HttpStatus.BAD_REQUEST,
        );
      }

      const newCapters = this.createCapters(
        perfil.indiceBase64,
        perfil.tituloLibro,
        newBook.id_libro,
      );

      if (!newCapters)
        throw new HttpException(
          'Capitulos de libro creados correctamente',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );

      return newBook;
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createOcrBook(imageBase64: string, nameBook: string) {
    const prompt = cretePromtAi(nameBook);

    try {
      const planResult = await this.openIaService.createPlan([
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ]);

      if (!planResult) {
        return undefined;
      }
      return planResult;
    } catch (error) {
      return undefined;
    }
  }

  async createCapters(imageBase64: string, nameBook: string, bookId: number) {
    const chaptersBook = await this.createOcrBook(imageBase64, nameBook);
    if (!chaptersBook)
      throw new HttpException(
        'Ocr ai no procesado correctamente',
        HttpStatus.BAD_REQUEST,
      );

    let ocrData: {
      capitulos: {
        titulos: string[];
        numeros_capitulo: number[];
        paginas_capitulo: number[];
      };
    };

    try {
      ocrData = JSON.parse(chaptersBook);

      const chapters: Prisma.ChapterCreateManyInput[] =
        ocrData.capitulos.titulos.map((titulo, index) => ({
          id_libro: bookId,
          numero_capitulo: ocrData.capitulos.numeros_capitulo[index],
          titulo_capitulo: titulo,
          paginas_estimadas: ocrData.capitulos.paginas_capitulo[index],
        }));

      const numberInserts = this.bookRepository.createChapter(chapters);

      if (!numberInserts)
        throw new HttpException(
          'error al insertar los capitulos',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );

      return numberInserts;
    } catch (err) {
      throw new Error(`Error al parsear OCR: ${err}`);
    }
  }

  async getChapters(idLibro: number) {
    try {
      const chapters = await this.bookRepository.getChapters(idLibro);
      if (!chapters) return undefined;

      return chapters;

    } catch (error) {
      return undefined;
    }
  }
}
