import { Controller, Post, Get, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  async me(@Headers('authorization') authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = authHeader.replace('Bearer ', '');
    const user = await this.authService.validateToken(token);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
