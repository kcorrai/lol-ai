import { NextRequest, NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getCounterTables } from "@/domains/draft/services/draftCountersService";

// Public. Called once per lock — at most ten times in a game — not per turn.
const COUNTERS_LIMIT = { limit: 60, windowMs: 60_000 };
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rl = await checkRateLimit(`draft-counters:${getIp(req)}`, COUNTERS_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const keys = (req.nextUrl.searchParams.get("keys") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const res = apiSuccess(await getCounterTables(keys));
  res.headers.set("Cache-Control", CACHE_CONTROL);
  return res;
}
