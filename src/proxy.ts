import { type NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

const COOKIE_NAME = 'bt_session';
const AUTH_PAGES = new Set(['/sign-in', '/sign-up', '/forget-password']);

let cachedSecret: Uint8Array | null = null;
let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

function getJwtSecret(): Uint8Array {
  if (!cachedSecret) {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      throw new Error('Missing SESSION_SECRET environment variable.');
    }
    cachedSecret = new TextEncoder().encode(secret);
  }
  return cachedSecret;
}

function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase admin environment variables.');
    }

    supabaseAdminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdminClient;
}

async function validateFlowToken(token: string, purpose?: string): Promise<boolean> {
  let query = getSupabaseAdmin()
    .from('auth_flow_tokens')
    .select('token_id')
    .eq('token', token)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString());

  if (purpose) {
    query = query.eq('purpose', purpose);
  }

  const { data } = await query.maybeSingle();
  return !!data;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.clone();
  const { pathname, searchParams } = url;

  // Handle maintenance mode
  const isMaintenance = process.env.MAINTENANCE_MODE === 'true';
  if (isMaintenance && pathname !== '/maintenance') {
    url.pathname = '/maintenance';
    return NextResponse.redirect(url);
  }
  if (!isMaintenance && pathname === '/maintenance') {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Check authentication status
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, getJwtSecret());
      isAuthenticated = true;
    } catch {
      // Ignore invalid or expired tokens
    }
  }

  // Protect email verification route
  if (pathname === '/verify-email') {
    const flowToken = searchParams.get('token');
    if (!flowToken || !(await validateFlowToken(flowToken))) {
      url.pathname = '/sign-in';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect password reset route
  if (pathname === '/forget-password' && searchParams.get('step') === 'reset') {
    const flowToken = searchParams.get('token');
    if (!flowToken || !(await validateFlowToken(flowToken, 'forgot-password'))) {
      url.pathname = '/sign-in';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users from auth pages
  if (AUTH_PAGES.has(pathname) && isAuthenticated) {
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