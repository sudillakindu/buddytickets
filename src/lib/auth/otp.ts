import { createHmac } from "crypto";
import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;
const EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const DELAYS = [60, 120, 300, 900, 3600, 86400];

/* ---------- pepper (HMAC-SHA256) ---------- */

function getPepper(): string {
    const secret = process.env.OTP_SECRET;
    if (!secret) {
        throw new Error(
            "Missing OTP_SECRET environment variable. " +
                "Generate one with: openssl rand -base64 32"
        );
    }
    return secret;
}

/**
 * HMAC the raw OTP with the server-side pepper.
 *
 * flow:  plaintext OTP → HMAC-SHA256(otp, OTP_SECRET) → bcrypt
 *
 * Even if the database is fully compromised the attacker still
 * cannot reverse the OTP codes without the pepper stored in env.
 */
function pepper(value: string): string {
    return createHmac("sha256", getPepper()).update(value).digest("hex");
}

/* ---------- OTP generation ---------- */

export function generateOtp(): string {
    const arr = new Uint32Array(1);
    globalThis.crypto.getRandomValues(arr);
    return String(100000 + (arr[0] % 900000));
}

/* ---------- hash / compare (peppered + bcrypt) ---------- */

export async function hashOtp(otp: string): Promise<string> {
    return hash(pepper(otp), SALT_ROUNDS);
}

export async function compareOtp(
    otp: string,
    hashed: string
): Promise<boolean> {
    return compare(pepper(otp), hashed);
}

/* ---------- timing helpers ---------- */

export function expiresAt(): string {
    return new Date(Date.now() + EXPIRY_MINUTES * 60_000).toISOString();
}

export function resendDelay(count: number): number {
    return DELAYS[Math.min(count, DELAYS.length - 1)];
}

export { MAX_ATTEMPTS };
