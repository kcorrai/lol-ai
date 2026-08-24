import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { prisma } from "@/lib/db/prisma";

// The catalogue changes at most once per patch, so re-reading 173 rows from Postgres on every
// request is pure egress — the amplification that exhausted the Neon transfer quota in TASK-282.
// `/api/champions/all` returns the same five columns from the same table and was given this exact
// header in TASK-278; this route was missed, and `force-dynamic` on top of it meant nothing could
// cache it at all. The rate limit caps the worst case, the header removes the common one.
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

// GET /api/public/champions — returns all champions from DB (populated by patchVersionPoller)
export async function GET(req: NextRequest): Promise<Response> {
  const rl = await checkRateLimit(`public-champs:${getIp(req)}`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const champions = await prisma.champion.findMany({
    select: { id: true, key: true, name: true, roles: true, imageUrl: true },
    orderBy: { name: "asc" },
  });

  const res = apiSuccess({ champions });
  res.headers.set("Cache-Control", CACHE_CONTROL);
  return res;
}
