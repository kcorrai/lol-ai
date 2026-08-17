import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PATHS = [
  "/dashboard",
  "/admin",
  "/match",
  "/matches",
  "/coaching",
  "/roadmap",
  "/settings",
  "/improvement",
  "/milestone",
  "/leaderboard",
  "/teams",
  "/achievements",
  "/recap",
  "/otp",
  "/analysis",
  "/onboarding",
  "/champion-pool",
  // The coach's own side of the marketplace. `/coaches` (plural) is the public
  // storefront and stays open — that is the acquisition surface.
  "/coach",
  "/sessions",
];

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // getToken is lightweight — reads and verifies the session cookie without a DB call
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuthenticated = Boolean(token);

  // Authenticated users should be redirected away from auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protected routes require authentication.
  //
  // Matched on a path boundary rather than a bare prefix: `/coaches` — the
  // public storefront, and the acquisition surface for the whole marketplace —
  // starts with `/coach`, so a plain `startsWith` would put a login wall in
  // front of it the moment the matcher below grew to cover it.
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
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
    "/match/:path*",
    "/matches/:path*",
    "/coaching/:path*",
    "/roadmap/:path*",
    "/settings/:path*",
    "/improvement/:path*",
    "/milestone/:path*",
    "/leaderboard/:path*",
    "/teams/:path*",
    "/achievements/:path*",
    "/recap/:path*",
    "/otp/:path*",
    "/analysis/:path*",
    "/onboarding/:path*",
    "/champion-pool/:path*",
    "/coach/:path*",
    "/sessions/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
