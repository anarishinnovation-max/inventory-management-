import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

const publicRoutes = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await decrypt(session);
    
    // RBAC Example: Protect owner-only routes
    if (pathname.startsWith("/admin") && payload.role !== "OWNER") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch (error) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
