import { prisma } from "@/lib/db/prisma";
import { getAiClient } from "@/lib/ai/client";
import { detectDeathCluster } from "@/domains/analysis/calculators/performanceCalculator";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import type { DeathCluster } from "@/domains/analysis/types/analysis.types";

const SUMMARY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface DeepDiveGame {
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  csPerMinute: number;
  gameDate: string;
}

export interface ChampionDeepDiveResult {
  championName: string;
  imageUrl: string;
  gamesPlayed: number;
  winRate: number;
  avgKda: number;
  avgCsPerMinute: number;
  avgVisionScore: number;
  avgDeathsPerGame: number;
  deathTiming: DeathCluster;
  recentGames: DeepDiveGame[];
  coachingSummary: string | null;
}

function avg(vals: number[]): number {
  return vals.length === 0 ? 0 : vals.reduce((s, v) => s + v, 0) / vals.length;
}

function buildSummaryPrompt(
  name: string,
  stats: {
    winRate: number;
    avgKda: number;
    avgCsPerMinute: number;
    avgVisionScore: number;
    avgDeathsPerGame: number;
    deathTiming: DeathCluster;
    gamesPlayed: number;
  }
): { system: string; user: string } {
  const timingLabel: Record<DeathCluster, string> = {
    early_game: "early-game trades",
    mid_game: "mid-game teamfights",
    late_game: "late-game skirmishes",
    spread: "spread throughout the game",
  };

  return {
    system:
      'You are a League of Legends coach. Return a JSON object: {"summary": "<coaching text>"}. ' +
      "The summary must be 3-4 sentences, written in second person, specific to the stats provided. " +
      "Identify one clear strength, one clear weakness, and end with one concrete drill or habit.",
    user:
      `Champion: ${name}\n` +
      `Games: ${stats.gamesPlayed}  Win Rate: ${stats.winRate}%  KDA: ${stats.avgKda}\n` +
      `CS/min: ${stats.avgCsPerMinute}  Vision: ${stats.avgVisionScore}  Deaths/game: ${stats.avgDeathsPerGame}\n` +
      `Deaths tend to happen during: ${timingLabel[stats.deathTiming]}\n\n` +
      "Write the coaching summary now.",
  };
}

export async function getChampionDeepDive(
  riotAccountId: string,
  championName: string
): Promise<ChampionDeepDiveResult | null> {
  const puuid = await getAccountPuuid(riotAccountId);
  // Recent matches for this champion
  const matches = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      championName,
      match: { queueType: "RANKED_SOLO_5x5" },
    },
    orderBy: { match: { gameStart: "desc" } },
    take: 20,
    select: {
      won: true,
      kills: true,
      deaths: true,
      assists: true,
      csPerMinute: true,
      visionScore: true,
      timeSpentDead: true,
      match: { select: { gameStart: true } },
    },
  });

  if (matches.length === 0) return null;

  // Champion image
  const champion = await prisma.champion.findFirst({
    where: { name: championName },
    select: { id: true, imageUrl: true },
  });

  // Aggregate stats
  const wins = matches.filter((m) => m.won).length;
  const winRate = Math.round((wins / matches.length) * 100);
  const kdas = matches.map((m) => (m.kills + m.assists) / Math.max(m.deaths, 1));
  const avgKda = parseFloat(avg(kdas).toFixed(2));
  const avgCsPerMinute = parseFloat(avg(matches.map((m) => Number(m.csPerMinute))).toFixed(1));
  const avgVisionScore = parseFloat(avg(matches.map((m) => m.visionScore)).toFixed(1));
  const avgDeathsPerGame = parseFloat(avg(matches.map((m) => m.deaths)).toFixed(1));
  const avgTimeSpentDead = avg(matches.map((m) => m.timeSpentDead));
  const deathTiming = detectDeathCluster(avgTimeSpentDead, avgDeathsPerGame);

  const recentGames: DeepDiveGame[] = matches.slice(0, 15).map((m) => ({
    won: m.won,
    kills: m.kills,
    deaths: m.deaths,
    assists: m.assists,
    csPerMinute: parseFloat(Number(m.csPerMinute).toFixed(1)),
    gameDate: m.match.gameStart.toISOString().slice(0, 10),
  }));

  // AI summary — read cache from ChampionStat then regenerate if stale
  let coachingSummary: string | null = null;

  if (champion) {
    const stat = await prisma.championStat.findUnique({
      where: {
        riotAccountId_championId_queueType: {
          riotAccountId,
          championId: champion.id,
          queueType: "RANKED_SOLO_5x5",
        },
      },
      select: { coachingSummary: true, coachingSummaryAt: true },
    });

    const stale =
      !stat?.coachingSummary ||
      !stat.coachingSummaryAt ||
      Date.now() - stat.coachingSummaryAt.getTime() > SUMMARY_TTL_MS;

    if (!stale && stat?.coachingSummary) {
      coachingSummary = stat.coachingSummary;
    } else {
      try {
        const ai = getAiClient();
        const { system, user } = buildSummaryPrompt(championName, {
          winRate,
          avgKda,
          avgCsPerMinute,
          avgVisionScore,
          avgDeathsPerGame,
          deathTiming,
          gamesPlayed: matches.length,
        });
        const result = await ai.complete(system, user, { maxTokens: 250, temperature: 0.5 });
        const parsed = JSON.parse(result.content) as { summary?: string };
        coachingSummary = parsed.summary ?? null;

        if (coachingSummary) {
          await prisma.championStat.updateMany({
            where: { riotAccountId, championId: champion.id, queueType: "RANKED_SOLO_5x5" },
            data: { coachingSummary, coachingSummaryAt: new Date() },
          });
        }
      } catch {
        // AI failure is non-fatal — return data without summary
      }
    }
  }

  return {
    championName,
    imageUrl: champion?.imageUrl ?? "",
    gamesPlayed: matches.length,
    winRate,
    avgKda,
    avgCsPerMinute,
    avgVisionScore,
    avgDeathsPerGame,
    deathTiming,
    recentGames,
    coachingSummary,
  };
}
