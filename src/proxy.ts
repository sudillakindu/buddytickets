import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
    const url = request.nextUrl.clone();
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

    // Redirect all traffic to /maintenance when maintenance mode is active
    if (isMaintenanceMode && url.pathname !== "/maintenance") {
        url.pathname = "/maintenance";
        return NextResponse.redirect(url);
    }

    // Prevent direct access to /maintenance when it's not active
    if (!isMaintenanceMode && url.pathname === "/maintenance") {
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    // Refresh the Supabase auth session on every request
    return await updateSession(request);
}

// Run middleware on all routes except static assets
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
