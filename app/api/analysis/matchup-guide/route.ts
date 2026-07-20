import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import {
  generateMatchupGuide,
  UnknownChampionError,
} from "@/domains/analysis/services/matchupGuideService";

export const dynamic = "force-dynamic";

// Every miss on this route is a paid LLM call, so the limit is per-user rather
// than per-IP — an IP key would let one account burn quota from many addresses.
const GUIDE_LIMIT = { limit: 20, windowMs: 3_600_000 };

interface GuideBody {
  playerChampion?: unknown;
  opponentChampion?: unknown;
  wins?: unknown;
  losses?: unknown;
  avgKda?: unknown;
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

// POST /api/analysis/matchup-guide
export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rate = await checkRateLimit(`matchup-guide:${userId}`, GUIDE_LIMIT);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);

  let body: GuideBody;
  try {
    body = (await req.json()) as GuideBody;
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  const { playerChampion, opponentChampion } = body;
  if (typeof playerChampion !== "string" || typeof opponentChampion !== "string") {
    throw Errors.validation("playerChampion and opponentChampion are required");
  }

  try {
    const result = await generateMatchupGuide({
      playerChampion,
      opponentChampion,
      wins: asNumber(body.wins),
      losses: asNumber(body.losses),
      avgKda: asNumber(body.avgKda),
    });
    return apiSuccess(result);
  } catch (err) {
    if (err instanceof UnknownChampionError) throw Errors.validation(err.message);
    throw err;
  }
});
