import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type { AuthenticatedUser } from './authenticated-user.js';
import {
  REMEMBERED_TOKEN_TTL,
  SHORT_TOKEN_TTL,
} from './auth.config.js';
import { verifyPassword } from './password.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(data: { name: string; email: string; password: string }) {
    return this.usersService.create(data);
  }

  async login(
    email: string,
    password: string,
    rememberMe: boolean,
  ): Promise<{ user: { id: number; name: string; email: string; createdAt: Date }; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.jwtService.signAsync(
      { email: user.email },
      {
        subject: String(user.id),
        expiresIn: rememberMe ? REMEMBERED_TOKEN_TTL : SHORT_TOKEN_TTL,
      },
    );

    const { password: _password, ...publicUser } = user;
    return { user: publicUser, token };
  }

  async validateUser(
    payload: { sub?: string; email?: string },
  ): Promise<AuthenticatedUser> {
    const id = Number(payload.sub);
    if (!Number.isSafeInteger(id) || id < 1 || !payload.email) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return user;
  }

  findProfile(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
  }
}
