import { NextRequest, NextResponse } from "next/server";
import { pairRequestSchema } from "@/domains/desktop/contract";
import { redeemPairingCode } from "@/domains/desktop/services/desktopPairingService";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { apiError, apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";

// POST /api/desktop/pair — the one endpoint that hands out a device token.
//
// No session, by design: the caller is a native process that has none, and the
// code it presents is the whole of its claim (ADR-038). Errors are returned
// rather than thrown — nothing wraps this handler, so a thrown ApiError would
// reach the client as a 500.
function invalid(): NextResponse {
  return apiError(
    "VALIDATION_ERROR",
    "That pairing code is not valid. Generate a new one on the website.",
    422
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // The gate that makes a ~39-bit code safe to guess against. Keyed on the
  // caller: there is no account to key on until a code actually matches, and
  // keying on the code would let a guesser lock out the code they are guessing.
  const rl = await checkRateLimit(`desktop-pair:${getIp(req)}`, { limit: 10, windowMs: 600_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const parsed = pairRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return invalid();

  const result = await redeemPairingCode(parsed.data);
  if (!result.ok) {
    if (result.reason === "too_many_devices") {
      return apiError(
        "DEVICE_LIMIT_REACHED",
        "This account has paired as many machines as it can. Revoke one in Settings.",
        409
      );
    }
    return invalid();
  }

  const res = apiSuccess(
    { token: result.token, device: result.device, account: result.account },
    201
  );
  // The only response in the product that carries this token. Nothing between
  // here and the app may keep a copy.
  res.headers.set("Cache-Control", "no-store");
  return res;
}
