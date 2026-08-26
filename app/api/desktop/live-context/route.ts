import { NextRequest, NextResponse } from "next/server";
import { liveContextRequestSchema } from "@/domains/desktop/contract";
import { getDeviceAccount } from "@/domains/desktop/services/desktopPairingService";
import { getLiveContext } from "@/domains/desktop/services/liveContextService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { apiError, apiSuccess } from "@/lib/api/response";
import { withDeviceAuth } from "@/lib/api/withDeviceAuth";

export const dynamic = "force-dynamic";

// POST /api/desktop/live-context — what the website knows about the game the app
// is watching (ADR-038, phase 4).
//
// POST rather than GET because the body is the game state the app observed, and
// because the answer is per-account and must never be cached anywhere between
// here and the machine that asked.
//
// The rule `withDeviceAuth` carries applies here in full: a stolen token must not
// be able to do anything worth stealing it for. What this returns is one account's
// own match history summarised into a lane — the same thing that account already
// sees on the website — and nothing that could change any of it.
export const POST = withDeviceAuth(async (req: NextRequest, { device }): Promise<NextResponse> => {
  // Keyed on the device, which is the only identity this endpoint has. Sized for a
  // real game rather than a real poll: the app asks once per matchup, and the
  // matchup changes when a game starts.
  //
  // Raised from twenty when the companion grew a screen that reads a matchup before
  // there is a game — the player names two champions and presses a button, so the
  // asking is deliberate but no longer once per forty minutes. Forty in ten minutes is
  // still far fewer than a loop would make, and the app caches each answer by matchup
  // so going back to one already looked at costs nothing here.
  const rl = await checkRateLimit(`desktop-live:${device.id}`, { limit: 40, windowMs: 600_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const parsed = liveContextRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "That is not a game this version can read", 422);
  }

  const account = await getDeviceAccount(device);
  // The account was deleted while the device kept its token — the same answer
  // `/api/desktop/me` gives, so the app lands on the pairing screen either way.
  if (!account) return apiError("UNAUTHORIZED", "This device is not paired", 401);

  const context = await getLiveContext(
    account.riotAccount?.id ?? null,
    account.userId,
    parsed.data
  );

  const res = apiSuccess(context);
  res.headers.set("Cache-Control", "no-store");
  return res;
});
