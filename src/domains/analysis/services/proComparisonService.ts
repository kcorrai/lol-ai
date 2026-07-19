import { prisma } from "@/lib/db/prisma";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

export interface ChampionProComparison {
  championId: number;
  championName: string;
  sampleSize: number;
  masterPlus: {
    avgCsPerMinute: number;
    avgVisionScore: number;
    avgKda: number;
    avgDamageShare: number;
    winRate: number;
  };
  player: {
    avgCsPerMinute: number;
    avgVisionScore: number;
    avgKda: number;
    avgDamageShare: number;
    winRate: number;
    gamesPlayed: number;
  };
}

const HIGH_ELO_TIERS = ["MASTER", "GRANDMASTER", "CHALLENGER"];
const CACHE_TTL_DAYS = 1;
const MIN_SAMPLE = 20;

async function getHighEloStats(championId: number): Promise<{
  avgCsPerMinute: number;
  avgVisionScore: number;
  avgKda: number;
  avgDamageShare: number;
  winRate: number;
  sampleSize: number;
} | null> {
  const cacheKey = buildCacheKey("pro-comparison-champion", { championId: String(championId) });
  const cached = await getCached(cacheKey);
  if (cached) return cached as Awaited<ReturnType<typeof getHighEloStats>>;

  const rows = await prisma.matchParticipant.findMany({
    where: {
      rankTier: { in: HIGH_ELO_TIERS as ["MASTER", "GRANDMASTER", "CHALLENGER"] },
      championId,
      match: { queueType: "RANKED_SOLO_5x5" },
    },
    select: {
      csPerMinute: true,
      visionScore: true,
      kills: true,
      deaths: true,
      assists: true,
      damageDealt: true,
      won: true,
      matchId: true,
    },
  });

  if (rows.length < MIN_SAMPLE) {
    return null;
  }

  // Compute damage share per match (requires fetching total team damage per match)
  // Approximate: use individual damage dealt as a proxy since team totals aren't stored
  const totalDamage = rows.reduce((s, r) => s + r.damageDealt, 0);
  const avgDmg = totalDamage / rows.length;

  const wins = rows.filter((r) => r.won).length;
  const avgKda = rows.reduce((s, r) => s + (r.kills + r.assists) / Math.max(r.deaths, 1), 0) / rows.length;

  const result = {
    avgCsPerMinute: Number((rows.reduce((s, r) => s + Number(r.csPerMinute), 0) / rows.length).toFixed(2)),
    avgVisionScore: Number((rows.reduce((s, r) => s + r.visionScore, 0) / rows.length).toFixed(1)),
    avgKda: Number(avgKda.toFixed(2)),
    avgDamageShare: Number((avgDmg / 10000).toFixed(2)),
    winRate: Number(((wins / rows.length) * 100).toFixed(1)),
    sampleSize: rows.length,
  };

  await setCached(cacheKey, "pro-comparison-champion", result, CACHE_TTL_DAYS);
  return result;
}

async function getPlayerChampionStats(
  riotAccountId: string,
  championId: number
): Promise<{
  avgCsPerMinute: number;
  avgVisionScore: number;
  avgKda: number;
  avgDamageShare: number;
  winRate: number;
  gamesPlayed: number;
} | null> {
  const puuid = await getAccountPuuid(riotAccountId);
  const rows = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      championId,
      match: { queueType: "RANKED_SOLO_5x5" },
    },
    select: {
      csPerMinute: true,
      visionScore: true,
      kills: true,
      deaths: true,
      assists: true,
      damageDealt: true,
      won: true,
    },
    orderBy: { match: { gameStart: "desc" } },
    take: 20,
  });

  if (rows.length === 0) return null;

  const wins = rows.filter((r) => r.won).length;
  const avgKda = rows.reduce((s, r) => s + (r.kills + r.assists) / Math.max(r.deaths, 1), 0) / rows.length;
  const avgDmg = rows.reduce((s, r) => s + r.damageDealt, 0) / rows.length;

  return {
    avgCsPerMinute: Number((rows.reduce((s, r) => s + Number(r.csPerMinute), 0) / rows.length).toFixed(2)),
    avgVisionScore: Number((rows.reduce((s, r) => s + r.visionScore, 0) / rows.length).toFixed(1)),
    avgKda: Number(avgKda.toFixed(2)),
    avgDamageShare: Number((avgDmg / 10000).toFixed(2)),
    winRate: Number(((wins / rows.length) * 100).toFixed(1)),
    gamesPlayed: rows.length,
  };
}

export async function getProComparison(
  riotAccountId: string,
  championId: number
): Promise<ChampionProComparison | null> {
  const champion = await prisma.champion.findUnique({
    where: { id: championId },
    select: { id: true, name: true },
  });
  if (!champion) return null;

  const [proStats, playerStats] = await Promise.all([
    getHighEloStats(championId),
    getPlayerChampionStats(riotAccountId, championId),
  ]);

  if (!proStats || !playerStats) return null;

  return {
    championId: champion.id,
    championName: champion.name,
    sampleSize: proStats.sampleSize,
    masterPlus: {
      avgCsPerMinute: proStats.avgCsPerMinute,
      avgVisionScore: proStats.avgVisionScore,
      avgKda: proStats.avgKda,
      avgDamageShare: proStats.avgDamageShare,
      winRate: proStats.winRate,
    },
    player: playerStats,
  };
}
