import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');

  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(`scrypt$${salt}$${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, salt, hash] = storedHash.split('$');
  if (
    algorithm !== 'scrypt' ||
    !salt ||
    !hash ||
    !/^[a-f0-9]{128}$/i.test(hash)
  ) {
    return false;
  }

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });

  return timingSafeEqual(derivedKey, Buffer.from(hash, 'hex'));
}
