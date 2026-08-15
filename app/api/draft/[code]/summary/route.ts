import { NextRequest, NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getDraftSummary } from "@/domains/draft/services/draftSummaryService";

// Public, and only ever answers for a *finished* game — so it can be cached for
// a while without ever serving a live draft's comps to the other bench.
const SUMMARY_LIMIT = { limit: 30, windowMs: 60_000 };
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=3600";

interface RouteParams {
  params: { code: string };
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const rl = await checkRateLimit(`draft-summary:${getIp(req)}`, SUMMARY_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const gameNumber = Number(req.nextUrl.searchParams.get("game") ?? "1");
  const summary = await getDraftSummary(
    params.code,
    Number.isInteger(gameNumber) && gameNumber >= 1 ? gameNumber : 1
  );

  if (!summary) {
    return apiError("RESOURCE_NOT_FOUND", "No finished draft for that game", 404);
  }

  const res = apiSuccess(summary);
  res.headers.set("Cache-Control", CACHE_CONTROL);
  return res;
}
