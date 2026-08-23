import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import { getPlayerPerformanceProfile } from "@/domains/analysis/services/matchAnalysisService";
import { getBenchmarkForTier } from "@/domains/analysis/services/rankBenchmarkService";
import {
  getTeamfightAnalysis,
  teamfightContextForAi,
} from "@/domains/analysis/services/teamfightService";
import type { CoachingInput, ChampionSummary } from "@/domains/coaching/types/coaching.types";

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
  const requestedMatches = profile.recentMatches
    .filter((m) => matchIds.includes(m.matchDbId))
    .slice(0, 10); // token budget cap

  if (requestedMatches.length === 0) {
    throw Errors.validation("No valid match data found for the requested matches.");
  }

  // Detect predominant queue type in requested matches
  const matchQueueTypes = await prisma.match.findMany({
    where: { id: { in: requestedMatches.map((m) => m.matchDbId) } },
    select: { id: true, queueType: true },
  });
  const queueCounts = matchQueueTypes.reduce<Record<string, number>>((acc, m) => {
    acc[m.queueType] = (acc[m.queueType] ?? 0) + 1;
    return acc;
  }, {});
  const predominantQueue =
    Object.entries(queueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "RANKED_SOLO_5x5";

  // Champion pool summary (top 5 by games played in analyzed set)
  const champMap = new Map<
    string,
    { wins: number; games: number; kdaSum: number; csSum: number }
  >();
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

  const [rankBenchmarks, teamfightAnalysis] = await Promise.all([
    latestRank ? getBenchmarkForTier(latestRank.tier) : Promise.resolve(null),
    getTeamfightAnalysis(riotAccountId, 10).catch(() => null),
  ]);
  const teamfightContext = teamfightAnalysis ? teamfightContextForAi(teamfightAnalysis) : undefined;

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
      queueType: predominantQueue,
      ...(focusArea ? { focusArea } : {}),
      ...(teamfightContext ? { teamfightContext } : {}),
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
