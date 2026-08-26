import { NextRequest, NextResponse } from "next/server";
import { parsePosition } from "@/domains/meta";
import { readChampion } from "@/domains/desktop/services/championBrowserService";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { apiError, apiSuccess } from "@/lib/api/response";
import { withDeviceAuth } from "@/lib/api/withDeviceAuth";

export const dynamic = "force-dynamic";

/**
 * The Data Dragon id out of the path.
 *
 * Read from the URL rather than from a `params` argument because `withDeviceAuth` hands
 * the handler the device and nothing else — the same reason `app/api/teams/[teamId]` reads
 * its own id this way.
 *
 * Letters only, which is what a Data Dragon id is: the punctuation lives in the display
 * name and never in the id — `Nunu & Willump` is `Nunu`, `Kai'Sa` is `Kaisa`, `Dr. Mundo`
 * is `DrMundo`. Checked against the whole live roster, whose longest id is twelve
 * characters. Anything else is refused here rather than sent on to key a cache.
 */
function championKey(req: NextRequest): string | null {
  const raw = decodeURIComponent(req.nextUrl.pathname.split("/").at(-1) ?? "");
  return /^[A-Za-z]{1,32}$/.test(raw) ? raw : null;
}

// GET /api/desktop/champions/[key]?role= — one champion in one lane (LA-75, ADR-042).
//
// The build carries item names rather than ids because the item catalogue is cached here
// and nowhere in the app — not because the app is refused the icons; its content policy
// admits Data Dragon. It is the same `LiveBuild` shape the live game panel gets, so the
// app has one build component and not two.
export const GET = withDeviceAuth(async (req: NextRequest, { device }): Promise<NextResponse> => {
  const rl = await checkRateLimit(`desktop-champions:${device.id}`, {
    limit: 120,
    windowMs: 600_000,
  });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const key = championKey(req);
  const position = parsePosition(req.nextUrl.searchParams.get("role"));
  if (!key || !position)
    return apiError("VALIDATION_ERROR", "That is not a champion and lane", 422);

  const champion = await readChampion(key, position);
  // One answer for an unknown champion and for one the snapshot has no entry for. The
  // app can act on neither, and telling them apart would mean guessing which applies.
  if (!champion) {
    return apiError("RESOURCE_NOT_FOUND", "No reading for that champion on this patch", 404);
  }

  const res = apiSuccess(champion);
  res.headers.set("Cache-Control", "no-store");
  return res;
});
