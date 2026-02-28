import { createHmac } from "crypto";
import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;
const MIN_LENGTH = 6;

/* ---------- pepper (HMAC-SHA256) ---------- */

function getPepper(): string {
    const secret = process.env.PASSWORD_SECRET;
    if (!secret) {
        throw new Error(
            "Missing PASSWORD_SECRET environment variable. " +
                "Generate one with: openssl rand -base64 32"
        );
    }
    return secret;
}

/**
 * HMAC the raw password with the server-side pepper.
 *
 * flow:  plaintext → HMAC-SHA256(plaintext, PASSWORD_SECRET) → bcrypt
 *
 * Even if the database is fully compromised the attacker still
 * cannot crack the hashes without the pepper stored in env.
 */
function pepper(value: string): string {
    return createHmac("sha256", getPepper()).update(value).digest("hex");
}

/* ---------- public API ---------- */

export async function hashPassword(password: string): Promise<string> {
    return hash(pepper(password), SALT_ROUNDS);
}

export async function comparePassword(
    password: string,
    hashed: string
): Promise<boolean> {
    return compare(pepper(password), hashed);
}

export { MIN_LENGTH };
