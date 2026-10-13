import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import type { AuthenticatedUser } from './authenticated-user.js';
import {
  ACCESS_TOKEN_COOKIE,
  REMEMBERED_COOKIE_MAX_AGE,
  SHORT_TOKEN_TTL,
} from './auth.config.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.register(createUserDto);
    const token = await this.jwtService.signAsync(
      { email: user.email },
      { subject: String(user.id), expiresIn: SHORT_TOKEN_TTL },
    );
    this.setAuthCookie(response, token, false);
    return user;
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, token } = await this.authService.login(
      loginDto.email,
      loginDto.password,
      loginDto.rememberMe,
    );
    this.setAuthCookie(response, token, loginDto.rememberMe);
    return user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions());
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.authService.findProfile(request.user.id);
  }

  private setAuthCookie(
    response: Response,
    token: string,
    rememberMe: boolean,
  ): void {
    response.cookie(ACCESS_TOKEN_COOKIE, token, {
      ...this.cookieOptions(),
      ...(rememberMe ? { maxAge: REMEMBERED_COOKIE_MAX_AGE } : {}),
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    };
  }
}
