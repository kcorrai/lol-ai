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

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: AuthContext
) => Promise<NextResponse>;

// Wraps a route handler with:
// - Session validation
// - requestId generation (propagated via AsyncLocalStorage for structured logging)
// - Sentry request tagging
// - Uniform error handling
export function withAuth(handler: AuthenticatedHandler) {
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
