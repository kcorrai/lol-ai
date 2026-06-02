import { prisma } from "@/lib/db/prisma";
import type { RankTier, RankDivision } from "@prisma/client";

export type CurrentRank = {
  tier: RankTier;
  division: RankDivision;
  lp: number;
  wins: number;
  losses: number;
};

export type LpSnapshot = {
  lp: number;
  recordedAt: string;
};

export async function getCurrentRank(riotAccountId: string): Promise<CurrentRank | null> {
  const entry = await prisma.rankedHistory.findFirst({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5" },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true, wins: true, losses: true },
  });
  return entry ?? null;
}

export async function getLpHistory(
  riotAccountId: string,
  limit = 10
): Promise<LpSnapshot[]> {
  const rows = await prisma.rankedHistory.findMany({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5" },
    orderBy: { recordedAt: "asc" },
    take: limit,
    select: { lp: true, recordedAt: true },
  });
  return rows.map((r) => ({ lp: r.lp, recordedAt: r.recordedAt.toISOString() }));
}
