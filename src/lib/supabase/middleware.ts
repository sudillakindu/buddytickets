import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        "Missing Supabase environment variables. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY are set."
    );
}

/**
 * Refreshes the Supabase auth session on every request.
 * Must be called inside middleware and the returned response forwarded
 * so that session cookies are kept up-to-date.
 */
export const updateSession = async (request: NextRequest) => {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                );
                supabaseResponse = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                );
            },
        },
    });

    // IMPORTANT: Do not add logic between createServerClient and auth.getUser().
    // Calling getUser() refreshes the auth token and keeps the session alive.
    await supabase.auth.getUser();

    return supabaseResponse;
};