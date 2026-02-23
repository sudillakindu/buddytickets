import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Check if maintenance mode is enabled via environment variables
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";

  // Clone the current request URL
  const url = request.nextUrl.clone();

  // If maintenance mode is ON and the user is not already on the maintenance page:
  if (isMaintenanceMode && url.pathname !== "/maintenance") {
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  // If maintenance mode is OFF but a user attempts to access /maintenance directly, redirect them to the home page:
  if (!isMaintenanceMode && url.pathname === "/maintenance") {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // If no conditions match, allow the request to proceed normally
  return NextResponse.next();
}

// Define paths where this Proxy should not run (e.g., static assets, images, etc.)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};