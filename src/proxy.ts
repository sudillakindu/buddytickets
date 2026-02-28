import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const COOKIE = "bt_session";
const AUTH_PAGES = new Set(["/sign-in", "/sign-up", "/forget-password"]);

function secret() {
    return new TextEncoder().encode(process.env.SESSION_SECRET!);
}

let _db: ReturnType<typeof createClient> | undefined;
function db() {
    if (!_db) {
        _db = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );
    }
    return _db;
}

async function isTokenValid(
    token: string,
    purpose?: string
): Promise<boolean> {
    let query = db()
        .from("auth_flow_tokens")
        .select("token_id")
        .eq("token", token)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString());

    if (purpose) query = query.eq("purpose", purpose);

    const { data } = await query.maybeSingle();
    return !!data;
}

export async function proxy(request: NextRequest) {
    const url = request.nextUrl.clone();
    const path = url.pathname;

    if (process.env.MAINTENANCE_MODE === "true" && path !== "/maintenance") {
        url.pathname = "/maintenance";
        return NextResponse.redirect(url);
    }
    if (process.env.MAINTENANCE_MODE !== "true" && path === "/maintenance") {
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    const jwt = request.cookies.get(COOKIE)?.value;
    let authed = false;
    if (jwt) {
        try {
            await jwtVerify(jwt, secret());
            authed = true;
        } catch {
            /* expired or invalid */
        }
    }

    if (path === "/verify-email") {
        const token = url.searchParams.get("token");
        if (!token || !(await isTokenValid(token))) {
            url.pathname = "/sign-in";
            url.search = "";
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    if (
        path === "/forget-password" &&
        url.searchParams.get("step") === "reset"
    ) {
        const token = url.searchParams.get("token");
        if (
            !token ||
            !(await isTokenValid(token, "forgot-password"))
        ) {
            url.pathname = "/sign-in";
            url.search = "";
            return NextResponse.redirect(url);
        }
    }

    if (AUTH_PAGES.has(path) && authed) {
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
