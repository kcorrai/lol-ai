import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { approvePairingRequest } from "@/domains/desktop/services/desktopPairingRequestService";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { apiError, apiSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

// POST /api/desktop/pairing-request/[requestId]/approve — the player says yes.
//
// This is the moment authority crosses from a signed-in browser to a process that
// has no session and never will (ADR-038). A POST behind the session, never a GET:
// approving must be something the player did, not something a page they opened did
// on their behalf.
export function POST(
  req: NextRequest,
  { params }: { params: { requestId: string } }
): Promise<NextResponse> {
  return withAuth(async (_r, { userId }): Promise<NextResponse> => {
    if (!z.string().uuid().safeParse(params.requestId).success) {
      throw Errors.notFound("Pairing request");
    }

    const rl = await checkRateLimit(`desktop-approve:${userId}`, { limit: 20, windowMs: 600_000 });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

    const result = await approvePairingRequest(userId, params.requestId);
    if (result.ok) return apiSuccess({ device: result.device }, 201);

    if (result.reason === "not_found") throw Errors.notFound("Pairing request");
    if (result.reason === "too_many_devices") {
      return apiError(
        "DEVICE_LIMIT_REACHED",
        "This account has paired as many machines as it can. Revoke one in Settings.",
        409
      );
    }
    // Expired and already-decided are told apart here, unlike on the claim path:
    // the person reading this is the account holder, and "it ran out, ask the app
    // again" is the sentence that gets them out of it.
    return apiError(
      result.reason === "expired" ? "REQUEST_EXPIRED" : "REQUEST_ALREADY_DECIDED",
      result.reason === "expired"
        ? "This request has expired. Press the button in the app again."
        : "This request has already been dealt with.",
      409
    );
  })(req);
}
