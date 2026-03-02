// lib/utils/session.ts
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

const COOKIE_NAME = "bt_session";
const MAX_AGE_SECONDS = 60 * 60 * 24;

let SESSION_SECRET: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (!SESSION_SECRET) {
    const secret = process.env.SESSION_SECRET;
    if (!secret)
      throw new Error("Missing SESSION_SECRET environment variable.");
    SESSION_SECRET = new TextEncoder().encode(secret);
  }
  return SESSION_SECRET;
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
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionUser;
  } catch (err) {
    logger.error({
      fn: "getSession",
      message: "Invalid session token",
      meta: err,
    });
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionUser;
  } catch (err) {
    logger.error({
      fn: "verifySessionToken",
      message: "Invalid session token",
      meta: err,
    });
    return null;
  }
}
