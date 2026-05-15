import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/session";

// Add routes that don't require authentication
const publicRoutes = ["/login", "/register", "/api/auth/login", "/api/auth/session"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Allow static assets and public routes
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    publicRoutes.some(route => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // 2. Check for session cookie
  const cookie = request.cookies.get("session")?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  if (!session) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Role-based routing
  if (pathname.startsWith("/admin") && session?.role !== "OWNER") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  if (pathname.startsWith("/super-admin") && session?.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Routes Proxy should not run on
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
