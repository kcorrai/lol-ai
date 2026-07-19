import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

const SNAPSHOT_WINDOW_DAYS = 7;
const MIN_GAMES = 5;

type AreaKey = "vision_control" | "death_reduction" | "cs_farming" | "objective_control" | "kda";

function computeAreaScores(
  avgVision: number,
  avgDeaths: number,
  avgCs: number,
  avgKda: number,
  avgObjectivesStolen: number
): Record<AreaKey, number> {
  return {
    // Normalized 0-100 scores. Higher is better.
    vision_control: Math.min(100, (avgVision / 30) * 100),
    death_reduction: Math.max(0, 100 - (avgDeaths / 10) * 100),
    cs_farming: Math.min(100, (avgCs / 8) * 100),
    kda: Math.min(100, (avgKda / 5) * 100),
    objective_control: Math.min(100, avgObjectivesStolen * 20),
  };
}

function computeTiltScore(matches: { won: boolean; deaths: number; gameDuration: number }[]): number {
  if (matches.length < 3) return 0;

  // Count loss streaks
  let maxStreak = 0;
  let current = 0;
  for (const m of matches) {
    if (!m.won) {
      current++;
      maxStreak = Math.max(maxStreak, current);
    } else {
      current = 0;
    }
  }

  // High deaths in recent games
  const avgDeaths = matches.reduce((s, m) => s + m.deaths, 0) / matches.length;

  const streakComponent = Math.min(100, maxStreak * 20);
  const deathComponent = Math.min(100, (avgDeaths / 8) * 100);

  return Math.round(streakComponent * 0.6 + deathComponent * 0.4);
}

export async function computeAndSaveSnapshot(riotAccountId: string): Promise<void> {
  const puuid = await getAccountPuuid(riotAccountId);
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - SNAPSHOT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      match: {
        queueType: "RANKED_SOLO_5x5",
        gameStart: { gte: periodStart, lte: periodEnd },
      },
    },
    select: {
      won: true,
      kills: true,
      deaths: true,
      assists: true,
      csPerMinute: true,
      visionScore: true,
      objectivesStolen: true,
      championId: true,
      match: { select: { gameDuration: true } },
    },
    orderBy: { match: { gameStart: "desc" } },
  });

  if (rows.length < MIN_GAMES) {
    logger.info(`[snapshot] Skipping ${riotAccountId} — only ${rows.length} games in window (need ${MIN_GAMES})`);
    return;
  }

  const wins = rows.filter((r) => r.won).length;
  const winRate = (wins / rows.length) * 100;
  const avgKda = rows.reduce((s, r) => s + (r.kills + r.assists) / Math.max(r.deaths, 1), 0) / rows.length;
  const avgCs = rows.reduce((s, r) => s + Number(r.csPerMinute), 0) / rows.length;
  const avgVision = rows.reduce((s, r) => s + r.visionScore, 0) / rows.length;
  const avgObjectivesStolen = rows.reduce((s, r) => s + r.objectivesStolen, 0) / rows.length;
  const avgDeaths = rows.reduce((s, r) => s + r.deaths, 0) / rows.length;

  const areaScores = computeAreaScores(avgVision, avgDeaths, avgCs, avgKda, avgObjectivesStolen);
  const sortedAreas = Object.entries(areaScores).sort((a, b) => b[1] - a[1]) as [AreaKey, number][];
  const strongestArea = sortedAreas[0][0];
  const weakestArea = sortedAreas[sortedAreas.length - 1][0];

  // Top 3 most played champion IDs
  const champCounts = new Map<number, number>();
  for (const r of rows) {
    champCounts.set(r.championId, (champCounts.get(r.championId) ?? 0) + 1);
  }
  const mostPlayedChampionIds = [...champCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  const tiltScore = computeTiltScore(
    rows.map((r) => ({ won: r.won, deaths: r.deaths, gameDuration: r.match.gameDuration }))
  );

  await prisma.performanceSnapshot.create({
    data: {
      riotAccountId,
      periodStart,
      periodEnd,
      gamesAnalyzed: rows.length,
      winRate: Number(winRate.toFixed(2)),
      avgKda: Number(avgKda.toFixed(2)),
      avgCsPerMinute: Number(avgCs.toFixed(2)),
      avgVisionScore: Number(avgVision.toFixed(2)),
      tiltScore: tiltScore > 0 ? Number(tiltScore.toFixed(2)) : null,
      mostPlayedChampionIds,
      strongestArea,
      weakestArea,
    },
  });

  logger.info(
    `[snapshot] Saved snapshot for ${riotAccountId}: ${rows.length} games, WR=${winRate.toFixed(0)}%, tilt=${tiltScore}`
  );
}
