import { AuthService } from './auth.service';
import { Body, Controller, HttpCode, HttpStatus, Post, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformDtoInterceptor } from 'src/shared/interceptors/transform-dto.interceptor';
import { UserDto } from './dto/user.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ description: 'create a new user from app' })
  @UseInterceptors(new TransformDtoInterceptor)
  async registerUser(@Body() user: UserDto): Promise<any> {

    return await this.authService.createUser(user);
  }


  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ description: 'login a new user for app' })
  @UseInterceptors(new TransformDtoInterceptor)
  async loginUser(@Body() loginUser : LoginDto) : Promise<any>{

    return this.authService.logInUser(loginUser)
  }

}
