import { NextRequest, NextResponse } from "next/server";
import { pairingRequestSchema } from "@/domains/desktop/contract";
import { openPairingRequest } from "@/domains/desktop/services/desktopPairingRequestService";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { apiError, apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";

// POST /api/desktop/pairing-request — a machine asks to be paired (ADR-048).
//
// No session, and nothing here grants anything: it writes a row saying a machine
// calling itself this asked at this time, which is worth nothing until a signed-in
// player approves it. The app then opens a browser at the path this returns.
//
// Rate limited per caller because it is an unauthenticated write. There is no
// account to key on — that is the whole point of the endpoint — and the cost of a
// flood is rows in a table with a ten-minute life, so the limit is generous enough
// to survive a player retrying and tight enough to stop a loop.
export async function POST(req: NextRequest): Promise<NextResponse> {
  const rl = await checkRateLimit(`desktop-pair-request:${getIp(req)}`, {
    limit: 20,
    windowMs: 600_000,
  });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const parsed = pairingRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "That is not a pairing request this app can open.", 422);
  }

  const opened = await openPairingRequest(parsed.data);

  const res = apiSuccess(opened, 201);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
