import 'dotenv/config';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const AUTH_ORIGIN =
  process.env.AUTH_ORIGIN ?? 'http://localhost:3000';
export const SHORT_TOKEN_TTL = '15m';
export const REMEMBERED_TOKEN_TTL = '30d';
export const REMEMBERED_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export function getJwtSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_JWT_SECRET must contain at least 32 characters');
  }
  return secret;
}
