import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
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
}

// Wraps a route handler with:
// - Session validation
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
          return apiError("UNAUTHORIZED", "Authentication required", 401);
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
