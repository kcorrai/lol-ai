import { NextRequest, NextResponse } from "next/server";
import { parsePosition } from "@/domains/meta";
import { listChampions } from "@/domains/desktop/services/championBrowserService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { apiError, apiSuccess } from "@/lib/api/response";
import { withDeviceAuth } from "@/lib/api/withDeviceAuth";

export const dynamic = "force-dynamic";

// GET /api/desktop/champions?role= — one lane's champions, for the companion's
// champion browser (LA-75, ADR-042).
//
// Device-authenticated like the rest of `/api/desktop/*`, though what it answers is
// public patch data rather than anything personal. That keeps one authentication story
// across the app's endpoints and gives the rate limit a device to key on, which is the
// identity that matters when the caller is a process rather than a browser.
export const GET = withDeviceAuth(async (req: NextRequest, { device }): Promise<NextResponse> => {
  // Sized for browsing rather than for the live call: a player flicking through five
  // lanes and a dozen champions is the normal case, and the answers are already cached
  // server-side, so the limit is here to stop a loop rather than to ration reading.
  const rl = await checkRateLimit(`desktop-champions:${device.id}`, {
    limit: 120,
    windowMs: 600_000,
  });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const position = parsePosition(req.nextUrl.searchParams.get("role"));
  if (!position) return apiError("VALIDATION_ERROR", "That is not a lane", 422);

  const list = await listChampions(position);
  // The patch snapshot could not be reached. Distinct from an empty lane on purpose:
  // one is worth retrying and the other is an answer.
  if (!list)
    return apiError("META_SNAPSHOT_UNAVAILABLE", "The patch snapshot is not available", 503);

  const res = apiSuccess(list);
  res.headers.set("Cache-Control", "no-store");
  return res;
});
