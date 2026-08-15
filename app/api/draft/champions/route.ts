import { NextRequest, NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getDraftCatalog } from "@/domains/draft/services/draftCatalogService";

// Public. Fetched once per room, then held for the whole series — the lane
// filter and the advice panel both read it, so nothing in a live draft needs a
// per-turn request. It only changes on a patch, hence the long CDN life.
const CATALOG_LIMIT = { limit: 30, windowMs: 60_000 };
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rl = await checkRateLimit(`draft-catalog:${getIp(req)}`, CATALOG_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const res = apiSuccess(await getDraftCatalog());
  res.headers.set("Cache-Control", CACHE_CONTROL);
  return res;
}
