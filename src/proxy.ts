import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const COOKIE = "bt_session";
const AUTH_PAGES = new Set(["/sign-in", "/sign-up", "/forget-password"]);

let cachedSecret: Uint8Array | undefined;

function getSecret(): Uint8Array {
    if (!cachedSecret) {
        const secret = process.env.SESSION_SECRET;
        if (!secret) {
            throw new Error(
                "Missing SESSION_SECRET environment variable. Generate one with: openssl rand -base64 32"
            );
        }
        cachedSecret = new TextEncoder().encode(secret);
    }
    return cachedSecret;
}

let supabaseClient: ReturnType<typeof createClient> | undefined;

function getDb() {
    if (!supabaseClient) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!url) {
            throw new Error(
                "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Set it to your Supabase project URL."
            );
        }
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!key) {
            throw new Error(
                "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Find it in your Supabase project settings."
            );
        }
        supabaseClient = createClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }
    return supabaseClient;
}

async function isTokenValid(token: string, purpose?: string): Promise<boolean> {
    let query = getDb()
        .from("auth_flow_tokens")
        .select("token_id")
        .eq("token", token)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString());

    if (purpose) {
        query = query.eq("purpose", purpose);
    }

    const { data } = await query.maybeSingle();
    return !!data;
}

export async function proxy(request: NextRequest) {
    const url = request.nextUrl.clone();
    const { pathname, searchParams } = url;

    // Handle maintenance mode routing
    const isMaintenance = process.env.MAINTENANCE_MODE === "true";
    if (isMaintenance && pathname !== "/maintenance") {
        url.pathname = "/maintenance";
        return NextResponse.redirect(url);
    }
    if (!isMaintenance && pathname === "/maintenance") {
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    // Validate current session token
    const jwt = request.cookies.get(COOKIE)?.value;
    let isAuthenticated = false;

    if (jwt) {
        try {
            await jwtVerify(jwt, getSecret());
            isAuthenticated = true;
        } catch {
            // Invalid or expired token is safely ignored
        }
    }

    // Enforce valid database token for email verification
    if (pathname === "/verify-email") {
        const token = searchParams.get("token");
        if (!token || !(await isTokenValid(token))) {
            url.pathname = "/sign-in";
            url.search = "";
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // Enforce valid database token for password resets
    if (pathname === "/forget-password" && searchParams.get("step") === "reset") {
        const token = searchParams.get("token");
        if (!token || !(await isTokenValid(token, "forgot-password"))) {
            url.pathname = "/sign-in";
            url.search = "";
            return NextResponse.redirect(url);
        }
    }

    // Redirect authenticated users away from authentication pages
    if (AUTH_PAGES.has(pathname) && isAuthenticated) {
        url.pathname = "/";
        url.search = "";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};