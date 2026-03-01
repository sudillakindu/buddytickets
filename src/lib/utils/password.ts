// lib/utils/password.ts
import { createHmac } from "crypto";
import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;

let PASSWORD_SECRET: string | null = null;

function getSecret(): string {
  if (!PASSWORD_SECRET) {
    PASSWORD_SECRET = process.env.PASSWORD_SECRET ?? "";
    if (!PASSWORD_SECRET)
      throw new Error("Missing PASSWORD_SECRET environment variable.");
  }
  return PASSWORD_SECRET;
}

function pepper(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
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
