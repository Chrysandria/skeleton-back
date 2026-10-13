import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { hashPassword } from './password.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';

describe('AuthService', () => {
  const prisma = {
    user: { findUnique: vi.fn() },
  };
  const jwtService = { signAsync: vi.fn() };
  const usersService = { create: vi.fn() };
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      usersService as unknown as UsersService,
    );
  });

  it('signs a 30-day token for a remembered login', async () => {
    const user = {
      id: 12,
      name: 'Alice',
      email: 'alice@example.com',
      password: await hashPassword('secure-password'),
      createdAt: new Date(),
    };
    prisma.user.findUnique.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValue('signed-token');

    await expect(
      service.login('alice@example.com', 'secure-password', true),
    ).resolves.toEqual({
      user: {
        id: 12,
        name: 'Alice',
        email: 'alice@example.com',
        createdAt: user.createdAt,
      },
      token: 'signed-token',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { email: user.email },
      { subject: '12', expiresIn: '30d' },
    );
  });

  it('rejects invalid credentials with a generic message', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login('missing@example.com', 'wrong-password', false),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
