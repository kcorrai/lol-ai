import { NextRequest, NextResponse } from "next/server";
import { requestPostGameSync } from "@/domains/desktop/services/postGameService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { apiSuccess } from "@/lib/api/response";
import { withDeviceAuth } from "@/lib/api/withDeviceAuth";

export const dynamic = "force-dynamic";

// POST /api/desktop/post-game — the app reporting that a game has ended
// (ADR-038, phase 5).
//
// The first desktop endpoint that writes, which is worth stating plainly:
// `withDeviceAuth` carries the rule that a stolen token must not be able to do
// anything worth stealing it for. What a stolen one can do here is cause the
// owner's own matches to be pulled from Riot slightly sooner than they would have
// been. It cannot name the account — that comes from the device row — and it
// cannot read anything back, because the pull is asynchronous and this answers
// before any of it has happened.
//
// No body. The app is reporting an event, not describing it: what game it was is
// something the website reads from Riot, not something it should take on the word
// of a client.
export const POST = withDeviceAuth(async (_req: NextRequest, { device }): Promise<NextResponse> => {
  // Sized for games. A match runs twenty to forty-five minutes, so six an hour is
  // more games than anyone finishes and few enough that a loop cannot spend the
  // account's Riot quota. The service's own in-progress guard is the second half
  // of that defence, and it holds even when this limit is not the binding one.
  const rl = await checkRateLimit(`desktop-postgame:${device.id}`, {
    limit: 6,
    windowMs: 3_600_000,
  });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const result = await requestPostGameSync(device);

  const res = apiSuccess({
    status: result.status,
    riotAccountId: result.status === "no_riot_account" ? null : result.riotAccountId,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
});
