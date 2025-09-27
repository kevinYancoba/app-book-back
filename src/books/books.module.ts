import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './services/books.service';
import { OpeniaService } from './services/openia.service';
import { BooksRepository } from './books-repository';

@Module({
  controllers: [BooksController],
  providers: [
    BooksService,
    OpeniaService,
    BooksRepository,
    {
      provide: OpeniaService,
      useFactory: () => {
        const apiKey = process.env.OPEN_IA_TOKEN || '';
        return new OpeniaService(apiKey, 'gpt-3.5-turbo');
      },
    },
  ],
  exports : [BooksService]
})
export class BooksModule {}
