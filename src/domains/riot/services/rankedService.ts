import { prisma } from "@/lib/db/prisma";
import type { RankTier, RankDivision } from "@prisma/client";

export type CurrentRank = {
  tier: RankTier;
  division: RankDivision;
  lp: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  inactive: boolean;
};

export type LpSnapshot = {
  lp: number;
  recordedAt: string;
};

export type RankedSnapshot = {
  tier: RankTier;
  division: RankDivision;
  lp: number;
};

type RankedQueue = "RANKED_SOLO_5x5" | "RANKED_FLEX_SR";

export async function getCurrentRank(
  riotAccountId: string,
  queueType: RankedQueue = "RANKED_SOLO_5x5"
): Promise<CurrentRank | null> {
  const entry = await prisma.rankedHistory.findFirst({
    where: { riotAccountId, queueType },
    orderBy: { recordedAt: "desc" },
    select: {
      tier: true,
      division: true,
      lp: true,
      wins: true,
      losses: true,
      hotStreak: true,
      inactive: true,
    },
  });
  return entry ?? null;
}

export async function getLpHistory(
  riotAccountId: string,
  limit = 10,
  queueType: RankedQueue = "RANKED_SOLO_5x5"
): Promise<LpSnapshot[]> {
  const rows = await prisma.rankedHistory.findMany({
    where: { riotAccountId, queueType },
    orderBy: { recordedAt: "asc" },
    take: limit,
    select: { lp: true, recordedAt: true },
  });
  return rows.map((r) => ({ lp: r.lp, recordedAt: r.recordedAt.toISOString() }));
}

export async function getLastRankedSnapshot(
  riotAccountId: string,
  queueType: RankedQueue
): Promise<RankedSnapshot | null> {
  const entry = await prisma.rankedHistory.findFirst({
    where: { riotAccountId, queueType },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });
  return entry ?? null;
}
