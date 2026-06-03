import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { ApiError } from "@/lib/api/errors";
import { apiError } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

type AuthContext = {
  userId: string;
  userEmail: string | null;
};

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: AuthContext
) => Promise<NextResponse>;

// Wraps a route handler with session validation and uniform error handling.
//
// Usage in route.ts:
//   export const GET = withAuth(async (req, { userId }) => {
//     const data = await myService.get(userId);
//     return apiSuccess(data);
//   });
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return apiError("UNAUTHORIZED", "Authentication required", 401);
      }

      return await handler(req, {
        userId: session.user.id,
        userEmail: session.user.email ?? null,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        return apiError(err.code, err.message, err.statusCode);
      }
      // Unexpected errors — capture and return generic 500
      logger.error("[withAuth] Unhandled error", err);
      Sentry.captureException(err);
      return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
    }
  };
}
