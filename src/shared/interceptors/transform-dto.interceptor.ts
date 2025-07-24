import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from './dto/api-response.dto';

@Injectable()
export class TransformDtoInterceptor<T> implements NestInterceptor {
   intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    
    return next.handle().pipe(
      map(data => {
        
        const statusCode = response.statusCode || HttpStatus.OK;
        const message = 'Operation successful'; 

        if (data instanceof ApiResponseDto) {
          return data;
        }

        return new ApiResponseDto<T>(statusCode, message, data);
      }),
    );
  }
}
