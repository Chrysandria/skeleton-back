import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';
import { UpdateUserDto } from './update-user.dto.js';

describe('User DTO validation', () => {
  it('accepts valid user data', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secure-password',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid email and short password values', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      name: 'Alice',
      email: 'not-an-email',
      password: 'short',
    });

    const errors = await validate(dto);
    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });

  it('allows a partial update', async () => {
    const dto = Object.assign(new UpdateUserDto(), { name: 'Alice Smith' });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
