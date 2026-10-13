import { hashPassword, verifyPassword } from './password.js';

describe('password hashing', () => {
  it('verifies a password without storing it in plaintext', async () => {
    const hash = await hashPassword('secure-password');

    expect(hash).not.toContain('secure-password');
    await expect(verifyPassword('secure-password', hash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects malformed hashes', async () => {
    await expect(verifyPassword('password', 'not-a-hash')).resolves.toBe(false);
  });
});
