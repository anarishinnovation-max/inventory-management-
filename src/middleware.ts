import { decrypt } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const host = request.headers.get("host") || "";
  
  // Extract subdomain (e.g., apple.localhost:3000 -> apple)
  const hostParts = host.split(".");
  let tenantSubdomain: string | null = null;

  // Simple logic for local/production subdomain extraction
  // Handles tenant.domain.com and tenant.localhost:3000
  if (hostParts.length >= 2 && !host.includes("localhost") || (host.includes("localhost") && hostParts.length >= 2)) {
    // If it's localhost and has parts like tenant.localhost:3000
    // hostParts will be ["tenant", "localhost:3000"]
    tenantSubdomain = hostParts[0];
    
    // Ignore "www", "localhost" as subdomains
    if (tenantSubdomain === "www" || tenantSubdomain === "localhost") {
      tenantSubdomain = null;
    }
  }

  // Skip middleware for static files and internal Next.js routes
  const isStaticFile = 
    url.pathname.startsWith("/_next") || 
    url.pathname.match(/\.(.*)$/);
    
  if (isStaticFile) return NextResponse.next();

  // Prepare headers for downstream
  const requestHeaders = new Headers(request.headers);
  if (tenantSubdomain) {
    requestHeaders.set("x-tenant-subdomain", tenantSubdomain);
  }

  // Public routes mapping
  const publicRoutes = ["/login", "/api/auth/login", "/register"];
  const isPublicRoute = publicRoutes.some(route => url.pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Session check
  const session = request.cookies.get("session")?.value;

  if (!session) {
    // If it's an API route, return 401 instead of redirecting
    if (url.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await decrypt(session);

    // RBAC logic (optional: can be moved to specific routes if needed)
    if (url.pathname.startsWith("/admin") && payload.role !== "OWNER") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    if (url.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
