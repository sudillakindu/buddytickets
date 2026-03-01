import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ─── Constants ───────────────────────────────────────────────────────────────

const COOKIE_NAME = "bt_session";

const PROTECTED_PAGES = new Set(["/profile", "/tickets"]);
const AUTH_ONLY_PAGES = new Set(["/sign-in", "/sign-up", "/forget-password"]);
const FLOW_PAGES = new Set(["/verify-email", "/reset-password"]);

let cachedSecret: Uint8Array | null = null;

// ─── Internal Helpers ────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
  if (!cachedSecret) {
    const secret = process.env.SESSION_SECRET;
    if (!secret)
      throw new Error("Missing SESSION_SECRET environment variable.");

    cachedSecret = new TextEncoder().encode(secret);
  }

  return cachedSecret;
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

// ─── Proxy Middleware ────────────────────────────────────────────────────────

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.clone();
  const { pathname, searchParams } = url;

  const isMaintenance = process.env.MAINTENANCE_MODE === "true";

  // Handle global maintenance mode redirects
  if (isMaintenance && pathname !== "/maintenance") {
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  if (!isMaintenance && pathname === "/maintenance") {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Validate flow pages require a valid token parameter
  if (FLOW_PAGES.has(pathname)) {
    const flowToken = searchParams.get("token");

    if (!flowToken) {
      url.pathname = "/sign-in";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  const authenticated = await isAuthenticated(request);

  // Redirect unauthenticated users from protected routes to sign-in
  if (PROTECTED_PAGES.has(pathname) && !authenticated) {
    url.pathname = "/sign-in";
    url.search = `?redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Bounce authenticated users away from auth-only routes
  if (AUTH_ONLY_PAGES.has(pathname) && authenticated) {
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// ─── Configuration ───────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
