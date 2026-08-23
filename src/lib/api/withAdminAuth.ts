import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { ApiError } from "@/lib/api/errors";
import { apiError } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

// Who the admin is, for routes that have to record who made a decision.
//
// Additive: handlers taking only `(req)` are still assignable, so every existing
// admin route is untouched. Nothing about the authorization decision changed —
// this only hands the handler the identity the wrapper had already established,
// which saves a second `getServerSession` in routes that write an audit log.
export interface AdminContext {
  adminId: string;
  adminEmail: string;
}

type AdminHandler = (req: NextRequest, ctx: AdminContext) => Promise<NextResponse>;

// Protects admin routes by verifying the current user's email matches ADMIN_EMAIL.
// Falls back gracefully — if ADMIN_EMAIL is not set, all authenticated users are blocked.
export function withAdminAuth(handler: AdminHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return apiError("FORBIDDEN", "Admin access not configured", 403);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    if (session.user.email !== adminEmail) {
      return apiError("FORBIDDEN", "Admin access required", 403);
    }

    // A password alone is not a session here either. `withAuth` has refused a
    // two-factor-pending session since TASK-276, but this wrapper never learned
    // the same check — so the one account with the most to lose was the one
    // whose API stayed open on the password alone. Middleware only guards the
    // `/admin` *pages*; every mutation goes through a route wrapped here.
    if (session.user.twoFactorPending) {
      return apiError(
        "TWO_FACTOR_REQUIRED",
        "Enter your two-factor code to finish signing in",
        401
      );
    }

    // Admin handlers throw `ApiError` the same way authenticated ones do, and
    // without this they surfaced as 500s — a validation failure on an admin
    // route answered "internal error" instead of saying what was wrong.
    // `withAuth` has always caught these; this is the same contract.
    try {
      return await handler(req, {
        adminId: session.user.id,
        adminEmail: session.user.email,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        return apiError(err.code, err.message, err.statusCode);
      }
      logger.error("[withAdminAuth] Unhandled error", err);
      Sentry.captureException(err);
      return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
    }
  };
}
