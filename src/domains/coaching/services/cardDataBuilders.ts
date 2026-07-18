import { prisma } from "@/lib/db/prisma";
import type { WeeklyCardData, MasteryCardData } from "./card.types";

// ── Weekly card data builder ───────────────────────────────────────────────────

export async function buildWeeklyData(
  riotAccountId: string,
  _userId: string,
  isPro: boolean
): Promise<WeeklyCardData> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { gameName: true, tagLine: true },
  });
  if (!account) throw new Error("Riot account not found");

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentParticipants = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId,
      match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: since } },
    },
    select: {
      won: true,
      championId: true,
      championName: true,
      kills: true,
      deaths: true,
      assists: true,
    },
  });

  const gamesPlayed = recentParticipants.length;
  const wins = recentParticipants.filter((p) => p.won).length;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

  // Best champion this week (min 2 games)
  const champMap = new Map<string, { games: number; wins: number }>();
  for (const p of recentParticipants) {
    const entry = champMap.get(p.championName) ?? { games: 0, wins: 0 };
    entry.games++;
    entry.wins += p.won ? 1 : 0;
    champMap.set(p.championName, entry);
  }
  let bestChampion = { name: "-", winRate: 0 };
  for (const [name, s] of champMap.entries()) {
    if (s.games >= 2) {
      const wr = Math.round((s.wins / s.games) * 100);
      if (wr > bestChampion.winRate) bestChampion = { name, winRate: wr };
    }
  }

  // LP delta: latest ranked_history entry this week vs 7 days ago
  const lpHistory = await prisma.rankedHistory.findMany({
    where: {
      riotAccountId,
      queueType: "RANKED_SOLO_5x5",
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: "asc" },
    take: 2,
  });
  const lpDelta =
    lpHistory.length >= 2
      ? lpHistory[lpHistory.length - 1].lp - lpHistory[0].lp
      : 0;

  // Latest coach grade from most recent completed report
  const lastReport = await prisma.coachingReport.findFirst({
    where: { riotAccountId, status: "complete" },
    orderBy: { completedAt: "desc" },
    select: { userRating: true },
  });

  // Mastery score for best champion
  let masteryScore: number | null = null;
  if (bestChampion.name !== "-") {
    const champ = await prisma.champion.findFirst({
      where: { name: bestChampion.name },
      select: { id: true },
    });
    if (champ) {
      const stat = await prisma.championStat.findUnique({
        where: {
          riotAccountId_championId_queueType: {
            riotAccountId,
            championId: champ.id,
            queueType: "RANKED_SOLO_5x5",
          },
        },
        select: { masteryScore: true },
      });
      masteryScore = stat?.masteryScore ?? null;
    }
  }

  const ratingToGrade = (r: number | null | undefined): string | null => {
    if (!r) return null;
    if (r >= 5) return "S";
    if (r >= 4) return "A";
    if (r >= 3) return "B";
    return "C";
  };

  return {
    cardType: "weekly",
    gameName: account.gameName,
    tagLine: account.tagLine,
    lpDelta,
    winRate,
    gamesPlayed,
    bestChampionName: bestChampion.name,
    bestChampionWinRate: bestChampion.winRate,
    masteryScore,
    coachGrade: ratingToGrade(lastReport?.userRating),
    isPro,
  };
}

// ── Mastery card data builder ──────────────────────────────────────────────────

export async function buildMasteryData(
  riotAccountId: string,
  championId: number,
  isPro: boolean
): Promise<MasteryCardData> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { gameName: true, tagLine: true },
  });
  if (!account) throw new Error("Riot account not found");

  const stat = await prisma.championStat.findUnique({
    where: {
      riotAccountId_championId_queueType: {
        riotAccountId,
        championId,
        queueType: "RANKED_SOLO_5x5",
      },
    },
    include: { champion: true },
  });

  if (!stat || stat.masteryScore === null) {
    throw new Error("Mastery score not computed for this champion");
  }

  const tierLabel = (score: number): string => {
    if (score >= 85) return "Legend";
    if (score >= 70) return "Master";
    if (score >= 55) return "Expert";
    if (score >= 40) return "Adept";
    return "Apprentice";
  };

  return {
    cardType: "mastery",
    gameName: account.gameName,
    tagLine: account.tagLine,
    championName: stat.champion.name,
    championImageUrl: stat.champion.imageUrl,
    masteryScore: stat.masteryScore,
    masteryTier: tierLabel(stat.masteryScore),
    gamesPlayed: stat.gamesPlayed,
    isPro,
  };
}
