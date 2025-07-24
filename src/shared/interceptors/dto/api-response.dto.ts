// src/common/dto/api-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'; // Opcional, para documentación de API

export class ApiResponseDto<T> {
  @ApiProperty({ description: 'HTTP status code', example: 200 })
  statusCode: number;

  @ApiProperty({ description: 'A message describing the result of the operation', example: 'Success' })
  message: string;

  @ApiProperty({ description: 'The actual data payload of the response' })
  data: T;

  constructor(statusCode: number, message: string, data: T) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}