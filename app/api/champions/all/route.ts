import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";

// Public endpoint — no auth required.
// Returns all champions (name, key, imageUrl) for use in selectors.
const CHAMPIONS_LIMIT = { limit: 30, windowMs: 60_000 };

// The catalogue changes at most once per patch, so re-reading 173 rows from Postgres on every
// request is pure egress — the same amplification that exhausted the Neon transfer quota in
// TASK-282. The rate limit caps the worst case; this cache header removes the common one.
const CACHE_CONTROL = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rl = await checkRateLimit(`champions-all:${getIp(req)}`, CHAMPIONS_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const champions = await prisma.champion.findMany({
    select: { id: true, key: true, name: true, imageUrl: true, roles: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: champions }, { headers: { "Cache-Control": CACHE_CONTROL } });
}
