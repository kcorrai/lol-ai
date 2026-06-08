import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import { getPlayerPerformanceProfile } from "@/domains/analysis/services/matchAnalysisService";
import type { CoachingInput, RankBenchmarks, ChampionSummary } from "@/domains/coaching/types/coaching.types";

// Tier-specific averages based on publicly available Riot data
// Used as context for the AI to benchmark the player against their rank
const RANK_BENCHMARKS: Record<string, RankBenchmarks> = {
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

export async function buildCoachingInput(
  riotAccountId: string,
  matchIds: string[],
  focusArea?: string
): Promise<CoachingInput> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { gameName: true, tagLine: true, region: true },
  });
  if (!account) throw Errors.notFound("Riot account");

  // Latest ranked snapshot
  const latestRank = await prisma.rankedHistory.findFirst({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5" },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });

  // Fetch enough history so champion-specific matches (which may not be the most recent)
  // are within the window. matchIds.length alone is insufficient when the player
  // alternates champions between sessions.
  const profile = await getPlayerPerformanceProfile(riotAccountId, 100);

  // Filter to only the requested matches (latest N)
  const requestedMatches = profile.recentMatches.filter((m) =>
    matchIds.includes(m.matchDbId)
  ).slice(0, 10); // token budget cap

  if (requestedMatches.length === 0) {
    throw Errors.validation("No valid match data found for the requested matches.");
  }

  // Champion pool summary (top 5 by games played in analyzed set)
  const champMap = new Map<string, { wins: number; games: number; kdaSum: number; csSum: number }>();
  for (const m of profile.recentMatches) {
    const existing = champMap.get(m.champion) ?? { wins: 0, games: 0, kdaSum: 0, csSum: 0 };
    champMap.set(m.champion, {
      wins: existing.wins + (m.won ? 1 : 0),
      games: existing.games + 1,
      kdaSum: existing.kdaSum + (m.kills + m.assists) / Math.max(m.deaths, 1),
      csSum: existing.csSum + m.csPerMinute,
    });
  }
  const championPool: ChampionSummary[] = [...champMap.entries()]
    .sort((a, b) => b[1].games - a[1].games)
    .slice(0, 5)
    .map(([name, stats]) => ({
      champion: name,
      gamesPlayed: stats.games,
      winRate: parseFloat(((stats.wins / stats.games) * 100).toFixed(1)),
      avgKDA: parseFloat((stats.kdaSum / stats.games).toFixed(2)),
      avgCSPerMinute: parseFloat((stats.csSum / stats.games).toFixed(2)),
    }));

  const rankBenchmarks = latestRank ? (RANK_BENCHMARKS[latestRank.tier] ?? null) : null;

  return {
    player: {
      riotId: `${account.gameName}#${account.tagLine}`,
      region: account.region,
      currentRank: latestRank
        ? { tier: latestRank.tier, rank: latestRank.division, lp: latestRank.lp }
        : null,
      roles: [...new Set(requestedMatches.map((m) => m.position))],
    },
    analysisContext: {
      periodGames: requestedMatches.length,
      queueType: "RANKED_SOLO_5x5",
      ...(focusArea ? { focusArea } : {}),
    },
    matches: requestedMatches.map((m, i) => ({
      matchNumber: i + 1,
      champion: m.champion,
      position: m.position,
      result: m.won ? "win" : "loss",
      durationMinutes: m.gameDurationMinutes,
      kda: { kills: m.kills, deaths: m.deaths, assists: m.assists },
      csPerMinute: m.csPerMinute,
      visionScore: m.visionScore,
      goldPerMinute: m.goldPerMinute,
      damageShare: m.damageShare,
      notableEvents: m.notableEvents.slice(0, 3), // token budget
    })),
    aggregateStats: {
      winRate: profile.winRate,
      avgKDA: profile.avgMetrics.kda,
      avgCSPerMinute: profile.avgMetrics.csPerMinute,
      avgVisionScore: parseFloat((profile.avgMetrics.visionScorePerMinute * 30).toFixed(1)),
      avgDeathsPerGame: profile.avgMetrics.avgDeathsPerGame,
      deathCluster: profile.deathCluster,
      csConsistency: profile.csConsistency,
      visionConsistency: profile.visionConsistency,
      mostPlayedChampions: profile.mostPlayedChampions,
    },
    rankBenchmarks,
    championPool,
  };
}
