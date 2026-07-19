import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

export interface ChampionMonth {
  name: string;
  games: number;
  wins: number;
  winRate: number;
  avgKda: number;
}

export interface MonthlyMilestone {
  label: string;
  year: number;
  month: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKda: number;
  avgCsPerMin: number;
  estimatedHours: number;
  topChampions: ChampionMonth[];
  rankStart: { tier: string; division: string; lp: number } | null;
  rankEnd: { tier: string; division: string; lp: number } | null;
  lpChange: number;
  bestWinStreak: number;
  bestKda: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TIER_ORDER: Record<string, number> = {
  IRON: 0, BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4,
  EMERALD: 5, DIAMOND: 6, MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9,
};
const DIV_ORDER: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };

function toGlobalLp(tier: string, div: string, lp: number): number {
  return (TIER_ORDER[tier] ?? 0) * 400 + (DIV_ORDER[div] ?? 0) * 100 + lp;
}

export async function getMonthlyMilestone(
  riotAccountId: string,
  year: number,
  month: number
): Promise<MonthlyMilestone | null> {
  const puuid = await getAccountPuuid(riotAccountId);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const participants = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      match: {
        gameStart: { gte: start, lt: end },
        queueType: "RANKED_SOLO_5x5",
      },
    },
    select: {
      won: true,
      kills: true,
      deaths: true,
      assists: true,
      cs: true,
      championName: true,
      match: { select: { gameDuration: true, gameStart: true } },
    },
    orderBy: { match: { gameStart: "asc" } },
  });

  if (participants.length === 0) return null;

  const wins = participants.filter((p) => p.won).length;
  const losses = participants.length - wins;

  const totalKda = participants.reduce(
    (s, p) => s + (p.kills + p.assists) / Math.max(p.deaths, 1),
    0
  );

  const totalDurationMin = participants.reduce(
    (s, p) => s + (p.match.gameDuration ?? 0) / 60,
    0
  );

  const avgCsPerMin =
    participants.reduce((s, p) => s + p.cs / Math.max((p.match.gameDuration ?? 1) / 60, 1), 0) /
    participants.length;

  // Best win streak
  let bestStreak = 0;
  let curStreak = 0;
  for (const p of participants) {
    if (p.won) {
      curStreak++;
      bestStreak = Math.max(bestStreak, curStreak);
    } else {
      curStreak = 0;
    }
  }

  // Best KDA single game
  const bestKda = Math.max(
    ...participants.map((p) => (p.kills + p.assists) / Math.max(p.deaths, 1))
  );

  // Top champions
  const champMap = new Map<string, { games: number; wins: number; totalKda: number }>();
  for (const p of participants) {
    const entry = champMap.get(p.championName) ?? { games: 0, wins: 0, totalKda: 0 };
    entry.games++;
    if (p.won) entry.wins++;
    entry.totalKda += (p.kills + p.assists) / Math.max(p.deaths, 1);
    champMap.set(p.championName, entry);
  }

  const topChampions: ChampionMonth[] = [...champMap.entries()]
    .sort((a, b) => b[1].games - a[1].games)
    .slice(0, 5)
    .map(([name, e]) => ({
      name,
      games: e.games,
      wins: e.wins,
      winRate: Math.round((e.wins / e.games) * 100),
      avgKda: Math.round((e.totalKda / e.games) * 100) / 100,
    }));

  // Rank snapshots
  const rankHistory = await prisma.rankedHistory.findMany({
    where: {
      riotAccountId,
      queueType: "RANKED_SOLO_5x5",
      recordedAt: { gte: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000), lt: end },
    },
    select: { tier: true, division: true, lp: true, recordedAt: true },
    orderBy: { recordedAt: "asc" },
  });

  const rankStart = rankHistory[0]
    ? { tier: String(rankHistory[0].tier), division: String(rankHistory[0].division), lp: rankHistory[0].lp }
    : null;
  const rankEnd = rankHistory[rankHistory.length - 1]
    ? { tier: String(rankHistory[rankHistory.length - 1]!.tier), division: String(rankHistory[rankHistory.length - 1]!.division), lp: rankHistory[rankHistory.length - 1]!.lp }
    : null;

  const lpChange =
    rankStart && rankEnd
      ? toGlobalLp(rankEnd.tier, rankEnd.division, rankEnd.lp) -
        toGlobalLp(rankStart.tier, rankStart.division, rankStart.lp)
      : 0;

  return {
    label: `${MONTH_NAMES[month - 1]} ${year}`,
    year,
    month,
    gamesPlayed: participants.length,
    wins,
    losses,
    winRate: Math.round((wins / participants.length) * 100),
    avgKda: Math.round((totalKda / participants.length) * 100) / 100,
    avgCsPerMin: Math.round(avgCsPerMin * 10) / 10,
    estimatedHours: Math.round(totalDurationMin / 60 * 10) / 10,
    topChampions,
    rankStart,
    rankEnd,
    lpChange,
    bestWinStreak: bestStreak,
    bestKda: Math.round(bestKda * 100) / 100,
  };
}
