import { prisma } from "@/lib/db/prisma";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { logger } from "@/lib/utils/logger";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import type { SeasonRecap } from "@prisma/client";

export interface RecapData {
  seasonLabel: string;
  totalMatches: number;
  winRate: number;
  lpDelta: number;
  startRank: string;
  endRank: string;
  topChampion: { name: string; games: number; winRate: number; kda: number };
  topChampions: { name: string; games: number; winRate: number; kda: number }[];
  bestStreak: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  estimatedHours: number;
  worstDay: { date: string; losses: number } | null;
  resolvedHabit: string | null;
  aiSummary: string;
  nextGoal: string | null;
}

function seasonStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 180);
  return d;
}

export function currentSeasonLabel(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() < 6 ? "Season1" : "Season2"}`;
}

function rankStr(tier: string, division: string): string {
  const apex = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  const t = tier.charAt(0) + tier.slice(1).toLowerCase();
  return apex.includes(tier) ? t : `${t} ${division}`;
}

async function aiSummary(data: Omit<RecapData, "aiSummary">): Promise<string> {
  const key = buildCacheKey("recap-summary", {
    season: data.seasonLabel,
    matches: String(data.totalMatches),
    wr: String(data.winRate),
    champ: data.topChampion.name,
  });
  const cached = await getCached(key);
  if (cached) return (cached as { s: string }).s;

  const prompt = `The player played ${data.totalMatches} matches in ${data.seasonLabel}. Win rate is ${data.winRate}%. Best champion is ${data.topChampion.name} (${data.topChampion.winRate}% WR). Climbed from ${data.startRank} to ${data.endRank}. LP change: ${data.lpDelta > 0 ? "+" : ""}${data.lpDelta}. In English, provide 3 sentences with motivating season evaluation. Highlight strengths and growth areas.`;

  try {
    const result = await getAiClient("lite").complete(
      "You are a LoL coach. Write a season evaluation.",
      prompt,
      { maxTokens: 200, temperature: 0.7 }
    );
    await setCached(key, "recap-summary", { s: result.content }, 7);
    return result.content;
  } catch (err) {
    logger.warn(`[recap] AI summary failed: ${err instanceof Error ? err.message : String(err)}`);
    return `You played ${data.totalMatches} matches in ${data.seasonLabel} with a ${data.winRate}% win rate. You performed great with ${data.topChampion.name}.`;
  }
}

export async function buildRecapData(userId: string, riotAccountId: string): Promise<RecapData> {
  const puuid = await getAccountPuuid(riotAccountId);
  const label = currentSeasonLabel();
  const start = seasonStart();

  const matches = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: start } },
    },
    select: {
      won: true,
      kills: true,
      deaths: true,
      assists: true,
      championName: true,
      match: { select: { gameStart: true } },
    },
    orderBy: { match: { gameStart: "asc" } },
  });

  if (matches.length < 5) throw new Error("Not enough matches for recap");

  const totalMatches = matches.length;
  const wins = matches.filter((m) => m.won).length;
  const winRate = Math.round((wins / totalMatches) * 100);

  // Best streak
  let bestStreak = 0;
  let streak = 0;
  for (const m of matches) {
    if (m.won) {
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else streak = 0;
  }

  // Worst day (most losses in a single day)
  const byDay = new Map<string, number>();
  for (const m of matches) {
    if (!m.won) {
      const day = m.match.gameStart.toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }
  }
  let worstDay: { date: string; losses: number } | null = null;
  for (const [date, losses] of byDay) {
    if (!worstDay || losses > worstDay.losses) worstDay = { date, losses };
  }

  // Total K/D/A
  let totalKills = 0,
    totalDeaths = 0,
    totalAssists = 0;
  for (const m of matches) {
    totalKills += m.kills;
    totalDeaths += m.deaths;
    totalAssists += m.assists;
  }
  const estimatedHours = Math.round((totalMatches * 30) / 60);

  // Top champions by games
  const champGames = new Map<string, { w: number; g: number; kda: number }>();
  for (const m of matches) {
    const s = champGames.get(m.championName) ?? { w: 0, g: 0, kda: 0 };
    s.g++;
    if (m.won) s.w++;
    s.kda += (m.kills + m.assists) / Math.max(m.deaths, 1);
    champGames.set(m.championName, s);
  }
  const topChampions = [...champGames.entries()]
    .sort((a, b) => b[1].g - a[1].g)
    .slice(0, 3)
    .map(([name, s]) => ({
      name,
      games: s.g,
      winRate: Math.round((s.w / s.g) * 100),
      kda: Math.round((s.kda / s.g) * 100) / 100,
    }));
  const topChamp = topChampions[0] ?? { name: "Unknown", games: 0, winRate: 0, kda: 0 };

  // Rank journey from RankedHistory
  const rankedHistory = await prisma.rankedHistory.findMany({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5", recordedAt: { gte: start } },
    orderBy: { recordedAt: "asc" },
    select: { tier: true, division: true, lp: true },
  });

  const first = rankedHistory[0];
  const last = rankedHistory[rankedHistory.length - 1];
  const startRank = first ? rankStr(first.tier, first.division) : "Unranked";
  const endRank = last ? rankStr(last.tier, last.division) : "Unranked";
  const lpDelta = (last?.lp ?? 0) - (first?.lp ?? 0);

  // Resolved habit
  const habit = await prisma.playerHabit.findFirst({
    where: { riotAccountId, isResolved: true },
    select: { habitType: true },
  });

  // Next goal from improvement plan
  const plan = await prisma.improvementPlan.findFirst({
    where: { riotAccountId, status: "active" },
    select: { targets: true },
  });
  let nextGoal: string | null = null;
  if (
    plan &&
    Array.isArray(plan.targets) &&
    (plan.targets as Array<{ label?: string }>)[0]?.label
  ) {
    nextGoal = (plan.targets as Array<{ label: string }>)[0].label;
  }

  const base = {
    seasonLabel: label,
    totalMatches,
    winRate,
    lpDelta,
    startRank,
    endRank,
    topChampion: topChamp,
    topChampions,
    bestStreak,
    totalKills,
    totalDeaths,
    totalAssists,
    estimatedHours,
    worstDay,
    resolvedHabit: habit?.habitType ?? null,
    nextGoal,
  };
  const summary = await aiSummary(base);
  return { ...base, aiSummary: summary };
}

export async function generateOrGetRecap(
  userId: string,
  riotAccountId: string
): Promise<SeasonRecap> {
  const label = currentSeasonLabel();
  const existing = await prisma.seasonRecap.findUnique({
    where: { userId_seasonLabel: { userId, seasonLabel: label } },
  });
  if (existing) {
    const d = existing.data as Record<string, unknown>;
    // Invalidate cache if missing new fields added in schema update
    if (d.topChampions !== undefined) return existing;
    await prisma.seasonRecap.delete({
      where: { userId_seasonLabel: { userId, seasonLabel: label } },
    });
  }

  const data = await buildRecapData(userId, riotAccountId);
  return prisma.seasonRecap.create({ data: { userId, seasonLabel: label, data: data as object } });
}
