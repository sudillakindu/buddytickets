import { createHmac } from 'crypto';
import { hash, compare } from 'bcryptjs';

const SALT_ROUNDS = 12;
let PASSWORD_SECRET_CACHE: string | null = null;

function getSecret(): string {
  if (!PASSWORD_SECRET_CACHE) {
    PASSWORD_SECRET_CACHE = process.env.PASSWORD_SECRET || '';
    if (!PASSWORD_SECRET_CACHE) {
      throw new Error('Missing PASSWORD_SECRET environment variable.');
    }
  }
  return PASSWORD_SECRET_CACHE;
}

function pepper(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return hash(pepper(password), SALT_ROUNDS);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return compare(pepper(password), hashed);
}