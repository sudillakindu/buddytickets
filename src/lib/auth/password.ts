import { createHmac } from "crypto";
import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;

function getSecret(): string {
    const secret = process.env.PASSWORD_SECRET;
    if (!secret) {
        throw new Error(
            "Missing PASSWORD_SECRET environment variable. Generate one with: openssl rand -base64 32"
        );
    }
    return secret;
}

// Applies HMAC-SHA256 pepper before bcrypting to protect against database breaches
function pepper(value: string): string {
    return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
    return hash(pepper(password), SALT_ROUNDS);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
    return compare(pepper(password), hashed);
}