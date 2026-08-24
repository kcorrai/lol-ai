import { randomUUID } from "crypto";
import type { DesktopDevice } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { readBearerToken } from "@/domains/desktop/deviceToken";
import { authenticateDevice } from "@/domains/desktop/services/desktopPairingService";
import { ApiError } from "@/lib/api/errors";
import { apiError } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";
import { requestContext } from "@/lib/context/requestContext";

type AuthContext = {
  userId: string;
  userEmail: string | null;
  requestId: string;
};

type AuthenticatedHandler = (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>;

export interface WithAuthOptions {
  /**
   * Let a half-authenticated session through. Only the 2FA challenge endpoint sets
   * this: it is the one thing a session owing a second factor is allowed to do, and
   * refusing it would make an account with 2FA on impossible to finish logging into.
   */
  allowTwoFactorPending?: boolean;
  /**
   * Let a paired desktop machine authenticate this route with its device token, in
   * place of the session cookie it has no way to carry (ADR-043).
   *
   * Off unless a route says otherwise, and that default is the point. A device token
   * is a capability sitting in a credential store on a machine that may be shared,
   * stolen or resold, so ADR-038's rule applies to every route that opts in: it must
   * never do anything a stolen token should not be able to do. Reading a dashboard
   * qualifies. Changing a password, a subscription or the second factor does not, and
   * `src-tauri/src/proxy.rs` refuses to send those from the other side as well.
   */
  deviceAccess?: boolean;
}

/**
 * Resolves the paired machine behind a bearer token, or null.
 *
 * The shape check runs before the database, so a probe walking these routes with junk
 * bearer tokens costs a regex rather than a query — the same order `withDeviceAuth`
 * uses, and the reason `readBearerToken` does the check rather than the caller.
 */
async function authenticatedDevice(req: NextRequest): Promise<DesktopDevice | null> {
  const token = readBearerToken(req.headers.get("authorization"));
  if (!token) return null;
  const authenticated = await authenticateDevice(token);
  return authenticated?.device ?? null;
}

// Wraps a route handler with:
// - Session validation, or a device token where the route allows one
// - requestId generation (propagated via AsyncLocalStorage for structured logging)
// - Sentry request tagging
// - Uniform error handling
export function withAuth(handler: AuthenticatedHandler, options: WithAuthOptions = {}) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const requestId = randomUUID();

    return requestContext.run({ requestId }, async () => {
      Sentry.withIsolationScope((scope) => {
        scope.setTag("requestId", requestId);
        scope.setTag("path", req.nextUrl.pathname);
      });

      try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
          // No cookie. A paired desktop machine is the one caller that legitimately
          // has none, and it presents a device token instead — but only where the
          // route has said it may. Everywhere else this stays a flat 401, and the
          // answer is the same one an unknown or revoked token gets, so walking the
          // API with a bearer token learns nothing about which routes opted in.
          const device = options.deviceAccess ? await authenticatedDevice(req) : null;
          if (!device) {
            return apiError("UNAUTHORIZED", "Authentication required", 401);
          }

          return await handler(req, {
            userId: device.userId,
            // Deliberately null rather than looked up. The three routes that read
            // this — account deletion, 2FA setup and checkout — are exactly the ones
            // a device token must never reach, so a device-authenticated request
            // having no email is a property worth keeping rather than a gap to fill.
            userEmail: null,
            requestId,
          });
        }

        // A password alone is not a session here. Without this every API route was
        // reachable the moment the password checked out, which made 2FA a setting
        // that changed nothing an attacker had to do.
        if (session.user.twoFactorPending && !options.allowTwoFactorPending) {
          return apiError(
            "TWO_FACTOR_REQUIRED",
            "Enter your two-factor code to finish signing in",
            401
          );
        }

        return await handler(req, {
          userId: session.user.id,
          userEmail: session.user.email ?? null,
          requestId,
        });
      } catch (err) {
        if (err instanceof ApiError) {
          return apiError(err.code, err.message, err.statusCode);
        }
        // Unexpected error — log with requestId, capture in Sentry
        logger.error("[withAuth] Unhandled error", err);
        Sentry.captureException(err);
        return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
      }
    });
  };
}
