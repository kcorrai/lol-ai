import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PATHS = [
  "/dashboard",
  "/matches",
  "/coaching",
  "/champions",
  "/roadmap",
  "/settings",
];

const AUTH_PATHS = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // getToken is lightweight — reads and verifies the session cookie without a DB call
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuthenticated = Boolean(token);

  // Authenticated users should be redirected away from auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protected routes require authentication
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all app + auth paths; skip API internals and static assets
  matcher: [
    "/dashboard/:path*",
    "/matches/:path*",
    "/coaching/:path*",
    "/champions/:path*",
    "/roadmap/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
