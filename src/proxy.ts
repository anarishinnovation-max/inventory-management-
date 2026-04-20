import { decrypt } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get("host") || "";
  
  // Extract subdomain (e.g., apple.localhost:3000 -> apple)
  const hostParts = host.split(".");
  let tenantSubdomain: string | null = null;

  // Simple logic for local/production subdomain extraction
  if (hostParts.length >= 2) {
    // Expecting tenant.domain.com or tenant.localhost:3000
    tenantSubdomain = hostParts[0];
  }

  // Skip tenant check for static files and internal Next.js routes
  const isExcluded = 
    url.pathname.startsWith("/_next") || 
    url.pathname.startsWith("/api") ||
    url.pathname.match(/\.(.*)$/);
    
  if (isExcluded) return NextResponse.next();

  // Public routes mapping
  const publicRoutes = ["/login", "/api/auth/login", "/register"];
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));

  if (isPublicRoute) return NextResponse.next();

  // Session check
  const session = request.cookies.get("session")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await decrypt(session);

    // RBAC logic
    if (url.pathname.startsWith("/admin") && payload.role !== "OWNER") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Pass tenant information to downstream Request/Server Components via headers
    const requestHeaders = new Headers(request.headers);
    if (tenantSubdomain) {
      requestHeaders.set("x-tenant-subdomain", tenantSubdomain);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
