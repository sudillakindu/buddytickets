// lib/utils/password.ts
import { hash, compare } from "bcryptjs";
import { getEnvSecret, hmacSha256 } from "./crypto";

const SALT_ROUNDS = 12;

function pepper(value: string): string {
  return hmacSha256(getEnvSecret("PASSWORD_SECRET"), value);
}

export async function hashPassword(password: string): Promise<string> {
  return hash(pepper(password), SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashed: string,
): Promise<boolean> {
  return compare(pepper(password), hashed);
}
