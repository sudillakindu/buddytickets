import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "bt_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function getSecret(): Uint8Array {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error(
            "Missing SESSION_SECRET environment variable. " +
                "Generate one with: openssl rand -base64 32"
        );
    }
    return new TextEncoder().encode(secret);
}

export interface SessionUser extends JWTPayload {
    sub: string;
    name: string;
    email: string;
    role: string;
    imageUrl: string | null;
}

export async function createSession(user: {
    user_id: string;
    name: string;
    email: string;
    role: string;
    image_url: string | null;
}): Promise<void> {
    const token = await new SignJWT({
        sub: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        imageUrl: user.image_url,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${MAX_AGE}s`)
        .sign(getSecret());

    (await cookies()).set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NEXT_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: MAX_AGE,
    });
}

export async function getSession(): Promise<SessionUser | null> {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as SessionUser;
    } catch {
        return null;
    }
}

export async function destroySession(): Promise<void> {
    (await cookies()).delete(COOKIE_NAME);
}

export async function verifySessionToken(
    token: string
): Promise<SessionUser | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload as SessionUser;
    } catch {
        return null;
    }
}
