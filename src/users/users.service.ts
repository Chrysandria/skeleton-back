import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashPassword } from '../auth/password.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { name, email, password } = createUserDto;
      return await this.prisma.user.create({
        data: {
          name,
          email,
          password: await hashPassword(password),
        },
        select: publicUserSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    this.validateId(id);
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    this.validateId(id);
    if (Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('At least one field must be provided');
    }

    try {
      const data: Prisma.UserUpdateInput = {};
      if (updateUserDto.name !== undefined) {
        data.name = updateUserDto.name;
      }
      if (updateUserDto.email !== undefined) {
        data.email = updateUserDto.email;
      }
      if (updateUserDto.password !== undefined) {
        data.password = await hashPassword(updateUserDto.password);
      }

      return await this.prisma.user.update({
        where: { id },
        data,
        select: publicUserSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: number) {
    this.validateId(id);

    try {
      return await this.prisma.user.delete({
        where: { id },
        select: publicUserSelect,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private validateId(id: number): void {
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new BadRequestException('User id must be a positive integer');
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('A user with this email already exists');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
    }

    throw error;
  }
}
