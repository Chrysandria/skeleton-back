import type { Response } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtService } from '@nestjs/jwt';
import {
  ACCESS_TOKEN_COOKIE,
  REMEMBERED_COOKIE_MAX_AGE,
} from './auth.config.js';

describe('AuthController', () => {
  const user = {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    createdAt: new Date(),
  };
  const authService = {
    login: vi.fn(),
    register: vi.fn(),
    findProfile: vi.fn(),
  };
  const jwtService = { signAsync: vi.fn() };
  const response = { cookie: vi.fn(), clearCookie: vi.fn() };
  let controller: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AuthController(
      authService as unknown as AuthService,
      jwtService as unknown as JwtService,
    );
  });

  it('sets an httpOnly persistent cookie when stay-connected is selected', async () => {
    authService.login.mockResolvedValue({ user, token: 'jwt-token' });

    await expect(
      controller.login(
        {
          email: user.email,
          password: 'secure-password',
          rememberMe: true,
        },
        response as unknown as Response,
      ),
    ).resolves.toEqual(user);

    expect(response.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'jwt-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        maxAge: REMEMBERED_COOKIE_MAX_AGE,
      }),
    );
  });

  it('uses a session cookie when stay-connected is not selected', async () => {
    authService.login.mockResolvedValue({ user, token: 'jwt-token' });

    await controller.login(
      {
        email: user.email,
        password: 'secure-password',
        rememberMe: false,
      },
      response as unknown as Response,
    );

    const cookieOptions = response.cookie.mock.calls[0]?.[2];
    expect(cookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: 'strict',
    });
    expect(cookieOptions).not.toHaveProperty('maxAge');
  });
});
