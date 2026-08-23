import type { DesktopDevice } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { readBearerToken } from "@/domains/desktop/deviceToken";
import { authenticateDevice } from "@/domains/desktop/services/desktopPairingService";
import { ApiError } from "@/lib/api/errors";
import { apiError } from "@/lib/api/response";
import { logger } from "@/lib/utils/logger";

// The desktop companion's half of `withAuth` (ADR-038).
//
// It authenticates a paired machine rather than a browser session: the app holds
// a capability token in the OS credential store and presents it as a bearer
// token, because a native process has no session cookie to carry. Same idea as
// the overlay key (ADR-026), and the same rule follows from it — a route wrapped
// in this must never do anything a stolen token should not be able to do.

type DeviceContext = { device: DesktopDevice };
type DeviceHandler = (req: NextRequest, ctx: DeviceContext) => Promise<NextResponse>;

function unauthorized(): NextResponse {
  // One answer for a missing token, a malformed one, an unknown one and a revoked
  // one. A device that has been cut off learns only that it is no longer welcome.
  return apiError("UNAUTHORIZED", "This device is not paired", 401);
}

export function withDeviceAuth(handler: DeviceHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Shape check before the database, so a probe walking these endpoints with
    // junk bearer tokens costs a regex rather than a query.
    const token = readBearerToken(req.headers.get("authorization"));
    if (!token) return unauthorized();

    try {
      const authenticated = await authenticateDevice(token);
      if (!authenticated) return unauthorized();

      return await handler(req, { device: authenticated.device });
    } catch (err) {
      if (err instanceof ApiError) {
        return apiError(err.code, err.message, err.statusCode);
      }
      // Nothing about the failure reaches the client: an error message is the
      // easiest way to leak the token that produced it.
      logger.error("[withDeviceAuth] Unhandled error", err);
      Sentry.captureException(err);
      return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
    }
  };
}
