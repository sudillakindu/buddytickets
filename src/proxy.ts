import { type NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'bt_session';

// Unauthenticated users are redirected to /sign-in for any of these routes
const PROTECTED_PAGES = new Set(['/profile', '/tickets']);

// Authenticated users are bounced to homepage from these routes
const AUTH_ONLY_PAGES = new Set(['/sign-in', '/sign-up', '/forget-password']);

// These pages require a valid ?token= query param — no token → redirect to /sign-in
const FLOW_PAGES = new Set(['/verify-email', '/reset-password']);

let cachedSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (!cachedSecret) {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('Missing SESSION_SECRET environment variable.');
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

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.clone();
  const { pathname, searchParams } = url;

  // Global maintenance mode redirect
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  if (isMaintenance && pathname !== '/maintenance') {
    url.pathname = '/maintenance';
    return NextResponse.redirect(url);
  }
  if (!isMaintenance && pathname === '/maintenance') {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Flow pages (/verify-email, /reset-password) require a query token
  // Deep DB validation is handled by the page itself
  if (FLOW_PAGES.has(pathname)) {
    const flowToken = searchParams.get('token');
    if (!flowToken) {
      url.pathname = '/sign-in';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Check session once and reuse for both guard checks below
  const authenticated = await isAuthenticated(request);

  // Protected pages: unauthenticated users are sent to /sign-in
  // Preserve the original path as ?redirect= so the app can return them after login
  if (PROTECTED_PAGES.has(pathname) && !authenticated) {
    url.pathname = '/sign-in';
    url.search = `?redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Auth-only pages: authenticated users are bounced to homepage
  if (AUTH_ONLY_PAGES.has(pathname) && authenticated) {
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};