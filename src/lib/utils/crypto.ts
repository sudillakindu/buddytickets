// lib/utils/crypto.ts
// Shared HMAC pepering utility used by password, OTP, and QR code modules.
import { createHmac } from "crypto";

type SecretEnvKey = "PASSWORD_SECRET" | "OTP_SECRET" | "QR_HMAC_SECRET";

const secretCache = new Map<SecretEnvKey, string>();

export function getEnvSecret(key: SecretEnvKey): string {
  const cached = secretCache.get(key);
  if (cached) return cached;

  const value = process.env[key] ?? "";
  if (!value) throw new Error(`Missing ${key} environment variable.`);

  secretCache.set(key, value);
  return value;
}

export function hmacSha256(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}
