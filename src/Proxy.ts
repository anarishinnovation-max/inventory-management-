import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

// Add routes that don't require authentication
const publicRoutes = ["/login", "/register", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = request.cookies.get("session")?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  // Redirect to login if accessing a private route without a session
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // Redirect to dashboard if accessing login with an active session
  if (isPublicRoute && session && path === "/login") {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  // Role-based routing (Example)
  if (path.startsWith("/admin") && session?.role !== "OWNER") {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
