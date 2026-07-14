import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";

export const dynamic = "force-dynamic";

interface GuideBody {
  playerChampion: string;
  opponentChampion: string;
  wins: number;
  losses: number;
  avgKda: number;
}

// POST /api/analysis/matchup-guide
// AI matchup guide, cached 7 days per champion pair (guide is user-agnostic)
export const POST = withAuth(async (req: NextRequest) => {
  let body: GuideBody;
  try {
    body = (await req.json()) as GuideBody;
  } catch {
    throw Errors.validation("Invalid JSON body");
  }

  const { playerChampion, opponentChampion, wins, losses, avgKda } = body;
  if (!playerChampion || !opponentChampion) {
    throw Errors.validation("playerChampion and opponentChampion are required");
  }

  const cacheKey = buildCacheKey("matchup-guide", { playerChampion, opponentChampion });
  const cached = await getCached(cacheKey);
  if (cached) return apiSuccess({ guide: (cached as { guide: string }).guide, cacheHit: true });

  const guide = await getAiClient().complete(
    "You are a LoL coaching assistant. You write short, action-oriented matchup guides.",
    `Write a ${playerChampion} vs ${opponentChampion} matchup guide. The player has ${wins}W/${losses}L in this matchup (KDA: ${avgKda}). Exactly 4 points: lane phase strategy, 1 mistake to avoid, gank timing, late game priority. One sentence per point.`,
    { maxTokens: 250, temperature: 0.5 }
  );

  await setCached(cacheKey, "matchup-guide", { guide: guide.content }, 7);
  return apiSuccess({ guide: guide.content, cacheHit: false });
});
