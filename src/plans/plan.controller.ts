import { Body, Controller, HttpCode, HttpStatus, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlanService } from './services/plan.service';
import { TransformDtoInterceptor } from 'src/shared/interceptors/transform-dto.interceptor';
import { PerilLecturaDto } from 'src/books/dto/perfil-lectura.dto';

@ApiTags('Plans')
@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post('createPlan')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ description: 'create a new user from app' })
  @UseInterceptors(new TransformDtoInterceptor())
  async registerUser(@Body() perfil: PerilLecturaDto): Promise<any> {
    return await this.planService.createPlan(perfil);
  }
}
