import { prisma } from "@/lib/db/prisma";
import { getCached, setCached } from "@/lib/ai/aiCache";
import type { RankBenchmarks } from "@/domains/coaching/types/coaching.types";

const CACHE_KEY = "rank-benchmarks-v1";
const CACHE_TTL_DAYS = 1;
const MIN_SAMPLE_SIZE = 50;

const TIER_ORDER = [
  "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
  "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER",
] as const;

// Fallback values (publicly known tier averages) used when DB has insufficient data
const STATIC_FALLBACK: Record<string, RankBenchmarks> = {
  IRON:        { tier: "IRON",        avgCSPerMinute: 4.5, avgVisionScore: 18, avgKDA: 1.8, avgWinRate: 50 },
  BRONZE:      { tier: "BRONZE",      avgCSPerMinute: 5.0, avgVisionScore: 20, avgKDA: 2.0, avgWinRate: 50 },
  SILVER:      { tier: "SILVER",      avgCSPerMinute: 5.8, avgVisionScore: 22, avgKDA: 2.3, avgWinRate: 50 },
  GOLD:        { tier: "GOLD",        avgCSPerMinute: 6.5, avgVisionScore: 26, avgKDA: 2.8, avgWinRate: 50 },
  PLATINUM:    { tier: "PLATINUM",    avgCSPerMinute: 7.0, avgVisionScore: 28, avgKDA: 3.0, avgWinRate: 50 },
  EMERALD:     { tier: "EMERALD",     avgCSPerMinute: 7.5, avgVisionScore: 30, avgKDA: 3.2, avgWinRate: 50 },
  DIAMOND:     { tier: "DIAMOND",     avgCSPerMinute: 8.0, avgVisionScore: 32, avgKDA: 3.5, avgWinRate: 50 },
  MASTER:      { tier: "MASTER",      avgCSPerMinute: 8.5, avgVisionScore: 35, avgKDA: 4.0, avgWinRate: 50 },
  GRANDMASTER: { tier: "GRANDMASTER", avgCSPerMinute: 9.0, avgVisionScore: 38, avgKDA: 4.5, avgWinRate: 50 },
  CHALLENGER:  { tier: "CHALLENGER",  avgCSPerMinute: 9.5, avgVisionScore: 40, avgKDA: 5.0, avgWinRate: 50 },
};

async function computeFromDb(): Promise<Record<string, RankBenchmarks>> {
  const rows = await prisma.matchParticipant.groupBy({
    by: ["rankTier"],
    where: {
      rankTier: { not: null },
      match: { queueType: "RANKED_SOLO_5x5" },
    },
    _avg: { csPerMinute: true, visionScore: true, kills: true, deaths: true, assists: true },
    _count: { id: true },
  });

  const result: Record<string, RankBenchmarks> = {};

  for (const row of rows) {
    if (!row.rankTier) continue;
    if (row._count.id < MIN_SAMPLE_SIZE) continue;

    const avgDeaths = row._avg.deaths ?? 1;
    const avgKills = row._avg.kills ?? 0;
    const avgAssists = row._avg.assists ?? 0;
    const avgKDA = (avgKills + avgAssists) / Math.max(avgDeaths, 1);

    result[row.rankTier] = {
      tier: row.rankTier,
      avgCSPerMinute: parseFloat(Number(row._avg.csPerMinute ?? 0).toFixed(2)),
      avgVisionScore: parseFloat(Number(row._avg.visionScore ?? 0).toFixed(1)),
      avgKDA: parseFloat(avgKDA.toFixed(2)),
      avgWinRate: 50,
    };
  }

  return result;
}

export async function getRankBenchmarks(): Promise<Record<string, RankBenchmarks>> {
  const cached = await getCached(CACHE_KEY);
  if (cached) return cached as Record<string, RankBenchmarks>;

  const dbData = await computeFromDb().catch(() => ({} as Record<string, RankBenchmarks>));

  // Merge: use DB data where we have enough samples, fall back per tier otherwise
  const merged: Record<string, RankBenchmarks> = {};
  for (const tier of TIER_ORDER) {
    merged[tier] = dbData[tier] ?? STATIC_FALLBACK[tier];
  }

  await setCached(CACHE_KEY, "rank-benchmarks", merged, CACHE_TTL_DAYS);
  return merged;
}

export async function getBenchmarkForTier(tier: string): Promise<RankBenchmarks | null> {
  const all = await getRankBenchmarks();
  return all[tier] ?? null;
}

// ARAM benchmarks — CS does not apply; damage share and healing are key metrics.
// Values are empirically derived from community data (patchpoints.gg / Fandom wiki averages).
export interface AramBenchmarks {
  avgKDA: number;
  avgDamageShare: number;   // fraction (0–1), typical carry champion: 0.20–0.28
  avgHealingPerMinute: number; // approximate gold equivalent
  avgVisionScore: number;  // much lower in ARAM (no wards)
  avgGoldPerMinute: number;
}

export const ARAM_BENCHMARKS: AramBenchmarks = {
  avgKDA: 3.2,
  avgDamageShare: 0.22,
  avgHealingPerMinute: 80,
  avgVisionScore: 12,
  avgGoldPerMinute: 420,
};
