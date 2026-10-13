import {
  ForbiddenException,
  Injectable,
  type NestMiddleware,
} from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AUTH_ORIGIN } from './auth.config.js';

@Injectable()
export class AuthOriginMiddleware implements NestMiddleware {
  use(
    request: Request,
    _response: Response,
    next: NextFunction,
  ): void {
    if (request.get('origin') !== AUTH_ORIGIN) {
      throw new ForbiddenException(`Only requests from ${AUTH_ORIGIN} are allowed`);
    }
    next();
  }
}
