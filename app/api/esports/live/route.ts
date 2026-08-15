import { NextRequest, NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getLiveEvents, getGameStats } from "@/domains/esports";

// Public and unauthenticated, and the only endpoint in the section a browser
// calls. A polling viewer makes two requests a minute, so this leaves plenty of
// headroom while still capping abuse (TASK-278).
const LIVE_LIMIT = { limit: 60, windowMs: 60_000 };

// Twenty seconds at the edge, under the client's thirty-second poll, so a shared
// CDN copy is never the reason a scoreboard looks frozen.
const CACHE_CONTROL = "public, s-maxage=20, stale-while-revalidate=40";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rl = await checkRateLimit(`esports-live:${getIp(req)}`, LIVE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const gameId = req.nextUrl.searchParams.get("gameId");

  const data = gameId
    ? { game: await getGameStats(gameId, { completed: false }) }
    : { events: await getLiveEvents() };

  const res = apiSuccess(data);
  res.headers.set("Cache-Control", CACHE_CONTROL);
  return res;
}
