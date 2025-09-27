import { BooksRepository } from './../books-repository';
import { PerilLecturaDto } from '../dto/perfil-lectura.dto';
import { OpeniaService } from './openia.service';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { cretePromtAi } from '../context-ai/prompt-ai';
import { Prisma } from '@prisma/client';

// Interface para la estructura del JSON del OCR
interface OcrResponse {
  capitulos: {
    titulos: string[];
    numeros_capitulo: number[];
    paginas_capitulo: number[];
  };
}

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    private openIaService: OpeniaService,
    private bookRepository: BooksRepository,
  ) {}

  async cretePerfil(perfil: PerilLecturaDto) {
    try {
      this.logger.log(`Creando perfil para usuario ${perfil.idUsuario}`);

      // Validar datos de entrada
      this.validatePerfilInput(perfil);

      // Crear perfil de lectura
      const newPerfil = await this.bookRepository.createPerfil(perfil);
      if (!newPerfil) {
        throw new HttpException(
          'Error al crear el perfil de lectura. Verifique que el usuario no tenga ya un perfil.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Crear libro
      const newBook = await this.bookRepository.createBook(perfil);
      if (!newBook) {
        throw new HttpException(
          'Error al crear el libro. Verifique los datos del libro.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Crear capítulos usando OCR
      await this.createCapters(
        perfil.indiceBase64,
        perfil.tituloLibro,
        newBook.id_libro,
      );

      this.logger.log(`Libro creado exitosamente con ID: ${newBook.id_libro}`);
      return newBook;
    } catch (error) {
      this.logger.error(`Error al crear perfil: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al crear el perfil y libro',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private validatePerfilInput(perfil: PerilLecturaDto): void {
    if (!perfil.idUsuario || perfil.idUsuario <= 0) {
      throw new HttpException('ID de usuario inválido', HttpStatus.BAD_REQUEST);
    }

    if (!perfil.tituloLibro || perfil.tituloLibro.trim().length === 0) {
      throw new HttpException(
        'Título del libro es requerido',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!perfil.autorLibro || perfil.autorLibro.trim().length === 0) {
      throw new HttpException(
        'Autor del libro es requerido',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!perfil.indiceBase64 || perfil.indiceBase64.trim().length === 0) {
      throw new HttpException(
        'Imagen del índice en Base64 es requerida',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createOcrBook(imageBase64: string, nameBook: string): Promise<string> {
    const prompt = cretePromtAi(nameBook);

    try {
      this.logger.log(`Procesando OCR para libro: ${nameBook}`);

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

      if (!planResult || planResult.trim().length === 0) {
        throw new HttpException(
          'La IA no pudo procesar la imagen del índice',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log('OCR procesado exitosamente');
      return planResult;
    } catch (error) {
      this.logger.error(`Error en OCR: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error al procesar la imagen con IA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createCapters(
    imageBase64: string,
    nameBook: string,
    bookId: number,
  ): Promise<any> {
    try {
      // Obtener resultado del OCR
      const chaptersBook = await this.createOcrBook(imageBase64, nameBook);

      // Validar y parsear el JSON del OCR
      const ocrData = this.validateAndParseOcrResponse(chaptersBook);

      // Validar que los arrays tengan la misma longitud
      this.validateOcrDataConsistency(ocrData);

      // Crear capítulos en la base de datos
      const chapters: Prisma.ChapterCreateManyInput[] =
        ocrData.capitulos.titulos.map((titulo, index) => ({
          id_libro: bookId,
          numero_capitulo: ocrData.capitulos.numeros_capitulo[index],
          titulo_capitulo: titulo.trim(),
          paginas_estimadas: ocrData.capitulos.paginas_capitulo[index] || null,
        }));

      const result = await this.bookRepository.createChapter(chapters);

      if (!result) {
        throw new HttpException(
          'Error al insertar los capítulos en la base de datos',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(
        `${chapters.length} capítulos creados exitosamente para el libro ${bookId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error al crear capítulos: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al procesar los capítulos del libro',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private validateAndParseOcrResponse(ocrResponse: string): OcrResponse {
    try {
      // Limpiar la respuesta de posibles caracteres extra
      const cleanResponse = ocrResponse
        .replace(/```json\s*/i, '') // Elimina la apertura de bloque
        .replace(/```/g, '') // Elimina el cierre de bloque
        .trim();

      // Intentar parsear el JSON
      const parsedData = JSON.parse(cleanResponse);

      // Validar estructura básica
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Respuesta del OCR no es un objeto válido');
      }

      if (!parsedData.capitulos || typeof parsedData.capitulos !== 'object') {
        throw new Error(
          'Estructura de capítulos no encontrada en la respuesta del OCR',
        );
      }

      const { capitulos } = parsedData;

      // Validar arrays requeridos
      if (!Array.isArray(capitulos.titulos)) {
        throw new Error('Array de títulos no válido en la respuesta del OCR');
      }

      if (!Array.isArray(capitulos.numeros_capitulo)) {
        throw new Error(
          'Array de números de capítulo no válido en la respuesta del OCR',
        );
      }

      // El array de páginas puede estar vacío según las instrucciones del prompt
      if (!Array.isArray(capitulos.paginas_capitulo)) {
        capitulos.paginas_capitulo = [];
      }

      return parsedData as OcrResponse;
    } catch (error) {
      this.logger.error(`Error al parsear respuesta del OCR: ${error.message}`);
      this.logger.debug(`Respuesta del OCR: ${ocrResponse}`);

      throw new HttpException(
        `Error al interpretar la respuesta del OCR: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private validateOcrDataConsistency(ocrData: OcrResponse): void {
    const { titulos, numeros_capitulo, paginas_capitulo } = ocrData.capitulos;

    // Validar que hay al menos un capítulo
    if (titulos.length === 0) {
      throw new HttpException(
        'No se encontraron capítulos en el índice del libro',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar que títulos y números tienen la misma longitud
    if (titulos.length !== numeros_capitulo.length) {
      throw new HttpException(
        'Inconsistencia en los datos del OCR: número de títulos y números de capítulo no coinciden',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Si hay páginas, validar que coincidan con los títulos
    if (
      paginas_capitulo.length > 0 &&
      paginas_capitulo.length !== titulos.length
    ) {
      throw new HttpException(
        'Inconsistencia en los datos del OCR: número de páginas no coincide con los capítulos',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar que los títulos no estén vacíos
    for (let i = 0; i < titulos.length; i++) {
      if (!titulos[i] || titulos[i].trim().length === 0) {
        throw new HttpException(
          `Título del capítulo ${i + 1} está vacío`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validar que los números de capítulo sean válidos
    for (let i = 0; i < numeros_capitulo.length; i++) {
      if (!Number.isInteger(numeros_capitulo[i]) || numeros_capitulo[i] <= 0) {
        throw new HttpException(
          `Número de capítulo inválido en la posición ${i + 1}: ${numeros_capitulo[i]}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  async getChapters(idLibro: number) {
    try {
      this.logger.log(`Obteniendo capítulos para libro ${idLibro}`);

      if (!idLibro || idLibro <= 0) {
        throw new HttpException('ID de libro inválido', HttpStatus.BAD_REQUEST);
      }

      const chapters = await this.bookRepository.getChapters(idLibro);

      if (!chapters || chapters.length === 0) {
        throw new HttpException(
          'No se encontraron capítulos para este libro',
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(
        `${chapters.length} capítulos encontrados para libro ${idLibro}`,
      );
      return chapters;
    } catch (error) {
      this.logger.error(
        `Error al obtener capítulos: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno al obtener los capítulos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
