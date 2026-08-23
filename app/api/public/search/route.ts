import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiSuccess } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { searchPlayers } from "@/domains/riot/services/playerIndexService";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

/**
 * Deliberately generous. This fires on keystrokes and answers from our own index — no Riot call,
 * one indexed prefix query. Throttling it the way `/api/public/preview` is throttled would make
 * autocomplete stop mid-word, which is the exact friction this feature exists to remove.
 */
const SEARCH_RATE_LIMIT = { limit: 150, windowMs: 60_000 };

const QuerySchema = z.object({
  q: z.string().min(1).max(64),
  region: z
    .string()
    .toLowerCase()
    .refine((r) => VALID_REGIONS.includes(r), "Unknown region")
    .optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

// GET /api/public/search?q=&region=&limit= — autocomplete over the player index. No auth: the
// whole point is that a player can find themselves before they have an account (TASK-309).
export async function GET(req: NextRequest): Promise<Response> {
  const rl = await checkRateLimit(`player-search:${getIp(req)}`, SEARCH_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const params = QuerySchema.safeParse({
    q: req.nextUrl.searchParams.get("q") ?? undefined,
    region: req.nextUrl.searchParams.get("region") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!params.success) {
    return NextResponse.json(
      { error: params.error.issues[0]?.message ?? "Invalid search" },
      { status: 400 }
    );
  }

  try {
    const hits = await searchPlayers(params.data.q, {
      region: params.data.region,
      limit: params.data.limit,
    });

    const response = apiSuccess({
      players: hits.map((h) => ({
        puuid: h.puuid,
        gameName: h.gameName,
        tagLine: h.tagLine,
        region: h.region,
        profileIconId: h.profileIconId,
        summonerLevel: h.summonerLevel,
      })),
    });
    // Short and private: suggestions change as the index grows, and a shared cache would hand one
    // visitor another's freshly-typed query.
    response.headers.set("Cache-Control", "private, max-age=15");
    return response;
  } catch (err) {
    logger.error("[player-search] query failed", {
      q: params.data.q,
      error: err instanceof Error ? err.message : String(err),
    });
    // An empty list, not a 500: a dead index should leave the search box usable, because the
    // caller can still fall back to resolving an exact Riot ID against Riot.
    return apiSuccess({ players: [] });
  }
}
