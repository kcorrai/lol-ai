import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import {
  computeKDA,
  computeDamageShare,
  computeKillParticipation,
  computeConsistency,
  detectDeathCluster,
  detectNotableEvents,
  identifyStrongestArea,
  identifyWeakestArea,
} from "@/domains/analysis/calculators/performanceCalculator";
import { classifyPlaystyle } from "@/domains/analysis/calculators/playstyleClassifier";
import type {
  PlayerPerformanceProfile,
  MatchPerformance,
  PerformanceMetrics,
  MetricDelta,
} from "@/domains/analysis/types/analysis.types";

export async function getPlayerPerformanceProfile(
  riotAccountId: string,
  gameCount = 20
): Promise<PlayerPerformanceProfile> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { puuid: true },
  });
  if (!account) throw Errors.notFound("Riot account");

  // Query match data by puuid, not riotAccountId, so every user who linked this Riot account sees
  // the same matches (TASK-228). Same rows for a single-user account.
  const playerMatches = await prisma.matchParticipant.findMany({
    where: { puuid: account.puuid },
    include: {
      match: {
        include: { participants: { select: { teamId: true, damageDealt: true, kills: true } } },
      },
    },
    // Ordered by the participant row's own copy of the match's start (ADR-040). There is no
    // queue filter here, so this is not the index's fully-ordered case — but it takes the sort
    // off the joined table, which is what made the plan walk `matches` backwards.
    orderBy: { gameStart: "desc" },
    take: gameCount,
  });

  if (playerMatches.length === 0) {
    throw Errors.validation("No match data found. Sync your account first.");
  }

  const matchPerformances: MatchPerformance[] = [];

  for (const p of playerMatches) {
    const teammates = p.match.participants.filter((t) => t.teamId === p.teamId);
    const teamDamage = teammates.reduce((s, t) => s + t.damageDealt, 0);
    const teamKills = teammates.reduce((s, t) => s + t.kills, 0);

    const damageShare = computeDamageShare(p.damageDealt, teamDamage);
    const durationMinutes = p.match.gameDuration / 60;

    matchPerformances.push({
      matchDbId: p.match.id,
      riotMatchId: p.match.matchId,
      queueType: p.match.queueType,
      champion: p.championName,
      position: p.position,
      won: p.won,
      gameDurationMinutes: parseFloat(durationMinutes.toFixed(1)),
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      csPerMinute: parseFloat(Number(p.csPerMinute).toFixed(2)),
      visionScore: p.visionScore,
      goldPerMinute: parseFloat(Number(p.goldPerMinute).toFixed(2)),
      damageShare,
      notableEvents: detectNotableEvents(
        p.kills,
        p.deaths,
        Number(p.csPerMinute),
        p.visionScore,
        p.firstBlood,
        p.position,
        p.won,
        teamKills
      ),
      itemIds: p.itemIds,
      gameStart: p.match.gameStart.toISOString(),
      summonerSpell1: p.summonerSpell1,
      summonerSpell2: p.summonerSpell2,
      runePrimaryKeystone: p.runePrimaryKeystone,
      runeSecondaryPath: p.runeSecondaryPath,
      teamObjectives: (() => {
        type ObjMap = Record<
          string,
          { towers: number; dragons: number; barons: number; inhibitors: number; heralds: number }
        >;
        const raw = p.match.teamObjectives as ObjMap | null;
        return raw?.[String(p.teamId)] ?? null;
      })(),
    });
  }

  const wins = matchPerformances.filter((m) => m.won).length;
  const winRate = parseFloat(((wins / matchPerformances.length) * 100).toFixed(1));

  // Aggregate metrics
  const avg = <K extends keyof MatchPerformance>(key: K): number => {
    const values = matchPerformances.map((m) => m[key] as number);
    return parseFloat((values.reduce((s, v) => s + v, 0) / values.length).toFixed(2));
  };

  const avgKDA = computeKDA(avg("kills"), avg("deaths"), avg("assists"));
  const avgCsPerMin = avg("csPerMinute");
  const avgVisionScore = avg("visionScore");
  const avgGoldPerMin = avg("goldPerMinute");
  const avgDamageShare = avg("damageShare");
  const avgDeaths = avg("deaths");

  const metrics: PerformanceMetrics = {
    kda: avgKDA,
    csPerMinute: avgCsPerMin,
    damageShare: avgDamageShare,
    killParticipation: computeKillParticipation(avg("kills"), avg("assists"), avg("kills") + 5),
    visionScorePerMinute: parseFloat(
      (avgVisionScore / (avg("gameDurationMinutes") || 1)).toFixed(3)
    ),
    avgGoldPerMinute: avgGoldPerMin,
    avgDeathsPerGame: avgDeaths,
  };

  const positionCounts = new Map<string, number>();
  for (const m of matchPerformances) {
    positionCounts.set(m.position, (positionCounts.get(m.position) ?? 0) + 1);
  }
  const dominantPosition =
    [...positionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "MIDDLE";

  const championCounts = new Map<string, number>();
  for (const m of matchPerformances) {
    championCounts.set(m.champion, (championCounts.get(m.champion) ?? 0) + 1);
  }
  const mostPlayedChampions = [...championCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  const avgTimeSpentDead =
    (
      await prisma.matchParticipant.aggregate({
        where: { puuid: account.puuid },
        _avg: { timeSpentDead: true },
      })
    )._avg.timeSpentDead ?? 0;

  // Delta: last 10 vs previous 10 (only computed when enough data exists)
  let delta: MetricDelta | undefined;
  if (matchPerformances.length >= 20) {
    const cur = matchPerformances.slice(0, 10);
    const prev = matchPerformances.slice(10, 20);
    const halfAvg = (matches: MatchPerformance[], key: keyof MatchPerformance) =>
      matches.reduce((s, m) => s + (m[key] as number), 0) / matches.length;

    delta = {
      winRate: parseFloat(
        (
          (cur.filter((m) => m.won).length / 10) * 100 -
          (prev.filter((m) => m.won).length / 10) * 100
        ).toFixed(1)
      ),
      kda: parseFloat(
        (
          computeKDA(halfAvg(cur, "kills"), halfAvg(cur, "deaths"), halfAvg(cur, "assists")) -
          computeKDA(halfAvg(prev, "kills"), halfAvg(prev, "deaths"), halfAvg(prev, "assists"))
        ).toFixed(2)
      ),
      csPerMinute: parseFloat(
        (halfAvg(cur, "csPerMinute") - halfAvg(prev, "csPerMinute")).toFixed(1)
      ),
      visionScore: parseFloat(
        (halfAvg(cur, "visionScore") - halfAvg(prev, "visionScore")).toFixed(1)
      ),
    };
  }

  return {
    riotAccountId,
    gamesAnalyzed: matchPerformances.length,
    avgMetrics: metrics,
    playstyle: classifyPlaystyle(metrics, dominantPosition),
    strongestArea: identifyStrongestArea(
      avgKDA,
      avgCsPerMin,
      avgVisionScore,
      avgDamageShare,
      winRate
    ),
    weakestArea: identifyWeakestArea(avgKDA, avgCsPerMin, avgVisionScore, winRate),
    recentMatches: matchPerformances,
    winRate,
    deathCluster: detectDeathCluster(Number(avgTimeSpentDead), avgDeaths),
    csConsistency: computeConsistency(matchPerformances.map((m) => m.csPerMinute)),
    visionConsistency: computeConsistency(matchPerformances.map((m) => m.visionScore)),
    mostPlayedChampions,
    delta,
  };
}
