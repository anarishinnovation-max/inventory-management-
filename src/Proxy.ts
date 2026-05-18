import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/session";

// 1. Specify public routes. Everything else is protected by default.
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/session'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Specific alias for /dashboard -> /
  if (pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // 2. Extract session from cookie
  const cookie = request.cookies.get('session')?.value;
  let session = null;
  
  if (cookie) {
    try {
      session = await decrypt(cookie);
    } catch (e) {
      // Invalid session
    }
  }

  // 3. Redirect to /login if the user is not authenticated and trying to access a protected route
  if (!isPublicRoute && !session) {
    // Avoid redirect loop if already on login
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.nextUrl));
    }
  }

  // 4. Redirect to / (Dashboard) if the user is authenticated and tries to access login/register
  if (isPublicRoute && session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.nextUrl));
  }

  // 5. Special handling for API routes (except auth)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 6. Role-based routing (Legacy preservation)
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
