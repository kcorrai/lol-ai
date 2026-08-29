import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { claimPairingSchema } from "@/domains/desktop/contract";
import { claimPairingRequest } from "@/domains/desktop/services/desktopPairingRequestService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { apiError, apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";

// POST /api/desktop/pairing-request/[requestId]/claim — the app takes its token.
//
// No session, like `/api/desktop/pair`: the caller is a native process, and the
// secret it presents is the whole of its claim. Errors are returned rather than
// thrown — nothing wraps this handler, so a thrown ApiError would land as a 500.
//
// Keyed on the request id rather than the caller's address, because the caller is
// the machine being paired and its address is not interesting; what needs bounding
// is how often one request can be guessed at. The app polls every two seconds for
// up to ten minutes, so the limit has to clear three hundred honest attempts.
function invalid(): NextResponse {
  return apiError(
    "VALIDATION_ERROR",
    "That pairing request is no longer open. Start again from the app.",
    422
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: { requestId: string } }
): Promise<NextResponse> {
  if (!z.string().uuid().safeParse(params.requestId).success) return invalid();

  const rl = await checkRateLimit(`desktop-claim:${params.requestId}`, {
    limit: 400,
    windowMs: 600_000,
  });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const parsed = claimPairingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid();

  const result = await claimPairingRequest(params.requestId, parsed.data.secret);

  // Still waiting is a success, not a failure: nothing has gone wrong, and the app
  // needs an answer it can keep polling against without treating it as an error.
  if (!result.ok && result.reason === "pending") {
    const res = apiSuccess({ status: "pending" as const, pairing: null });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }
  if (!result.ok) return invalid();

  const res = apiSuccess(
    {
      status: "approved" as const,
      pairing: { token: result.token, device: result.device, account: result.account },
    },
    201
  );
  // One of the two responses in the product that carries this token. Nothing
  // between here and the app may keep a copy.
  res.headers.set("Cache-Control", "no-store");
  return res;
}
