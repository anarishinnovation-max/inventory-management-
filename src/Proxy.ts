import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/session";

// 1. Specify protected and public routes
const protectedRoutes = ['/dashboard', '/inventory', '/orders', '/reports', '/settings', '/users'];
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/session', '/'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname);

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

  // 3. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // 4. Redirect to /dashboard if the user is authenticated and tries to access public routes
  if (isPublicRoute && session && !pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
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
