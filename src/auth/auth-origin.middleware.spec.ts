import { ForbiddenException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AuthOriginMiddleware } from './auth-origin.middleware.js';

describe('AuthOriginMiddleware', () => {
  const middleware = new AuthOriginMiddleware();
  const response = {} as Response;

  it('allows requests from the configured frontend origin', () => {
    const next = vi.fn() as unknown as NextFunction;

    middleware.use(
      { get: () => 'http://localhost:3000' } as unknown as Request,
      response,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects requests from other origins and requests without an origin', () => {
    for (const origin of ['http://localhost:3001', undefined]) {
      expect(() =>
        middleware.use(
          { get: () => origin } as unknown as Request,
          response,
          vi.fn() as unknown as NextFunction,
        ),
      ).toThrow(ForbiddenException);
    }
  });
});
