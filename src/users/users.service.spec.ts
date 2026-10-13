import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('UsersService', () => {
  let service: UsersService;
  const prisma = {
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('creates a user with a hashed password and returns only public fields', async () => {
    const user = {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      createdAt: new Date(),
    };
    prisma.user.create.mockResolvedValue(user);

    await expect(
      service.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secure-password',
      }),
    ).resolves.toEqual(user);

    const createArgs = prisma.user.create.mock.calls[0]?.[0];
    expect(createArgs.data.password).toMatch(/^scrypt\$[a-f0-9]+\$[a-f0-9]+$/);
    expect(createArgs.select).not.toHaveProperty('password');
  });

  it('reads users using public fields only', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await expect(service.findAll()).resolves.toEqual([]);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.not.objectContaining({ password: true }),
      }),
    );
  });

  it('rejects invalid IDs before querying the database', async () => {
    await expect(service.findOne(0)).rejects.toThrow(
      'User id must be a positive integer',
    );
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects empty updates', async () => {
    await expect(service.update(1, {})).rejects.toThrow(
      'At least one field must be provided',
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('deletes a user by ID', async () => {
    const user = {
      id: 1,
      name: 'Alice',
      email: 'alice@example.com',
      createdAt: new Date(),
    };
    prisma.user.delete.mockResolvedValue(user);

    await expect(service.remove(1)).resolves.toEqual(user);
    expect(prisma.user.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });
});
