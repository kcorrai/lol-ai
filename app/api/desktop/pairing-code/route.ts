import { NextRequest, NextResponse } from "next/server";
import { issuePairingCode } from "@/domains/desktop/services/desktopPairingService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { apiSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

// POST /api/desktop/pairing-code — mint the code the player types into the app.
//
// Issuing invalidates whatever was outstanding, so this is also the "I lost it,
// give me another" button. Rate limited because each call burns the previous
// code: a loop here would leave a player whose app is mid-exchange staring at a
// code that stopped working while they typed it.
export const POST = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  const rl = await checkRateLimit(`desktop-code:${userId}`, { limit: 10, windowMs: 600_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  return apiSuccess(await issuePairingCode(userId));
});
