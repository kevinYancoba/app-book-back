import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ type: String, description: 'ID del usuario como string' })
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ type: Date, format: 'date-time' })
  createdAt?: Date | null;

  @ApiProperty({ type: Date, format: 'date-time' })
  updatedAt?: Date | null;

}
