import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import type { Position } from "@prisma/client";

export interface OtpRecommendation {
  championId: number;
  name: string;
  position: Position;
  games: number;
  winRate: number; // 0-100
  avgKda: number;
}

const MIN_GAMES = 3;

// Ranks an OTP candidate by volume × success × comfort. Mastery is unknown for many champions, so a
// null score is treated as neutral. Pure so it can be unit-tested (TASK-235).
export function scoreOtp(gamesPlayed: number, wins: number, masteryScore: number | null): number {
  const winRate = gamesPlayed > 0 ? wins / gamesPlayed : 0;
  const masteryWeight = 0.5 + (masteryScore ?? 50) / 100; // 0.5 (unknown/low) .. 1.5 (elite)
  return gamesPlayed * winRate * masteryWeight;
}

// Recommends which champions the user should one-trick, from their own ranked data (TASK-235).
export async function getRecommendedOtps(
  riotAccountId: string,
  limit = 3
): Promise<OtpRecommendation[]> {
  const puuid = await getAccountPuuid(riotAccountId);
  if (!puuid) return [];

  const stats = await prisma.championStat.findMany({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5", gamesPlayed: { gte: MIN_GAMES } },
    select: {
      championId: true,
      gamesPlayed: true,
      wins: true,
      avgKda: true,
      masteryScore: true,
      champion: { select: { name: true } },
    },
  });
  if (stats.length === 0) return [];

  // Most-played position per champion, from the shared match data (by puuid).
  const posRows = await prisma.matchParticipant.groupBy({
    by: ["championId", "position"],
    where: { puuid, match: { queueType: "RANKED_SOLO_5x5" } },
    _count: { _all: true },
  });
  const bestPos = new Map<number, Position>();
  const bestPosCount = new Map<number, number>();
  for (const r of posRows) {
    const count = r._count._all;
    if (count > (bestPosCount.get(r.championId) ?? 0)) {
      bestPosCount.set(r.championId, count);
      bestPos.set(r.championId, r.position);
    }
  }

  return stats
    .map((s) => ({
      championId: s.championId,
      name: s.champion.name,
      position: bestPos.get(s.championId) ?? "MIDDLE",
      games: s.gamesPlayed,
      winRate: s.gamesPlayed > 0 ? Math.round((s.wins / s.gamesPlayed) * 100) : 0,
      avgKda: Number(s.avgKda),
      score: scoreOtp(s.gamesPlayed, s.wins, s.masteryScore),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ score: _score, ...rec }) => rec);
}
