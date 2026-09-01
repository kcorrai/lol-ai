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
  // Lives in the `(app)` group whose layout says "unauthenticated requests are
  // redirected by middleware" — which was true of every sibling except this one.
  "/timeline",
  "/otp",
  "/analysis",
  "/onboarding",
  "/champion-pool",
  // The coach's own side of the marketplace. `/coaches` (plural) is the public
  // storefront and stays open — that is the acquisition surface.
  "/coach",
  // The Streamer Kit. `/overlay` is deliberately NOT here: OBS cannot carry a
  // session, and the overlay key is what authenticates it instead (ADR-026).
  "/creator",
  "/sessions",
  "/messages",
];

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

// Paths that sit under a guarded prefix but are public on purpose. A share link is
// handed to someone who does not have an account — putting the login wall in front of
// it defeats the only thing it is for. The page itself still refuses a recap whose
// owner has not made it public, so the check that matters is not the one removed here.
const PUBLIC_EXCEPTIONS = ["/recap/share"];

// Where a session that has passed the password but not the second factor is sent.
// Deliberately not under `/login`: `AUTH_PATHS` bounces an authenticated visitor
// away from anything there, and a half-authenticated one counts as authenticated.
const TWO_FACTOR_PATH = "/two-factor";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // getToken is lightweight — reads and verifies the session cookie without a DB call
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuthenticated = Boolean(token);
  const twoFactorPending = token?.twoFactorPending === true;

  // Authenticated users should be redirected away from auth pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    // Sent to the challenge, not the dashboard: the dashboard would only bounce
    // them here anyway, and the round trip loses the message about what is missing.
    return NextResponse.redirect(
      new URL(twoFactorPending ? TWO_FACTOR_PATH : "/dashboard", req.url)
    );
  }

  // Checked first, and on the same path boundary: an exception names a public page that
  // happens to live under a guarded prefix, so it has to win over the guard above it.
  const isPublicException = PUBLIC_EXCEPTIONS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // Protected routes require authentication.
  //
  // Matched on a path boundary rather than a bare prefix: `/coaches` — the
  // public storefront, and the acquisition surface for the whole marketplace —
  // starts with `/coach`, so a plain `startsWith` would put a login wall in
  // front of it the moment the matcher below grew to cover it.
  const isProtected =
    !isPublicException &&
    PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // A correct password gets you exactly as far as the challenge page. Everything
  // else behind the login wall stays shut until the second factor is answered.
  if (isProtected && twoFactorPending) {
    const challengeUrl = new URL(TWO_FACTOR_PATH, req.url);
    challengeUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    return NextResponse.redirect(challengeUrl);
  }

  // Having answered it, there is nothing on that page to come back for.
  if (pathname === TWO_FACTOR_PATH && isAuthenticated && !twoFactorPending) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname === TWO_FACTOR_PATH && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
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
    "/timeline/:path*",
    "/otp/:path*",
    "/analysis/:path*",
    "/onboarding/:path*",
    "/champion-pool/:path*",
    "/coach/:path*",
    "/creator/:path*",
    "/sessions/:path*",
    "/messages/:path*",
    "/admin/:path*",
    "/two-factor",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
