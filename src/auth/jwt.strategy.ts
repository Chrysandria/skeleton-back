import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { ACCESS_TOKEN_COOKIE, getJwtSecret } from './auth.config.js';
import type { AuthenticatedUser } from './authenticated-user.js';
import { AuthService } from './auth.service.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          request.cookies?.[ACCESS_TOKEN_COOKIE] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
    this.authService = authService;
  }

  private readonly authService: AuthService;

  validate(payload: { sub?: string; email?: string }): Promise<AuthenticatedUser> {
    return this.authService.validateUser(payload);
  }
}
