import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// GET /api/public/champions — returns all champions from DB (populated by patchVersionPoller)
export async function GET(req: NextRequest): Promise<Response> {
  const rl = await checkRateLimit(`public-champs:${getIp(req)}`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const champions = await prisma.champion.findMany({
    select: { id: true, key: true, name: true, roles: true, imageUrl: true },
    orderBy: { name: "asc" },
  });

  return apiSuccess({ champions });
}
