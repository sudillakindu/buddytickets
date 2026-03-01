// lib/utils/otp.ts
import { createHmac } from 'crypto';
import { hash, compare } from 'bcryptjs';

const SALT_ROUNDS = 12;
const EXPIRY_MINUTES = 10;
const RESEND_DELAYS = [60, 120, 300, 900, 3600, 86400];

export const MAX_ATTEMPTS = 5;

let OTP_SECRET: string | null = null;

function getSecret(): string {
  if (!OTP_SECRET) {
    OTP_SECRET = process.env.OTP_SECRET ?? '';
    if (!OTP_SECRET) throw new Error('Missing OTP_SECRET environment variable.');
  }
  return OTP_SECRET;
}

function pepper(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex');
}

export function generateOtp(): string {
  const arr = new Uint32Array(1);
  globalThis.crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

export async function hashOtp(otp: string): Promise<string> {
  return hash(pepper(otp), SALT_ROUNDS);
}

export async function compareOtp(otp: string, hashed: string): Promise<boolean> {
  return compare(pepper(otp), hashed);
}

export function expiresAt(): string {
  return new Date(Date.now() + EXPIRY_MINUTES * 60_000).toISOString();
}

export function resendDelay(count: number): number {
  const index = Math.min(Math.max(0, count), RESEND_DELAYS.length - 1);
  return RESEND_DELAYS[index];
}