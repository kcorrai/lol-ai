import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import { buildCertificate } from "@/domains/academy";
import { getCareerTimeline } from "@/domains/analysis";
import type {
  WeeklyCardData,
  MasteryCardData,
  AcademyCardData,
  CareerCardData,
} from "./card.types";

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

  const puuid = await getAccountPuuid(riotAccountId);
  const recentParticipants = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
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

// ── Academy certificate data builder ──────────────────────────────────────────

/**
 * A certificate for a finished track. The academy domain decides what "finished" means and
 * refuses to issue one otherwise — a certificate for a part-read track would be decoration.
 */
export async function buildAcademyData(
  userId: string,
  trackId: string
): Promise<AcademyCardData> {
  const certificate = await buildCertificate(userId, trackId);
  if (!certificate) throw new Error("TRACK_NOT_FINISHED");

  return {
    cardType: "academy",
    displayName: certificate.displayName,
    trackTitle: certificate.trackTitle,
    lessonsTotal: certificate.lessonsTotal,
    lessonsMastered: certificate.lessonsMastered,
    finishedAt: certificate.finishedAt,
  };
}

// ── Career card data builder ───────────────────────────────────────────────────

/**
 * The career card is built from the same timeline the page renders rather than from a
 * second set of queries. A card that disagreed with the page it was shared from would
 * be the one thing nobody could explain.
 */
export async function buildCareerData(
  riotAccountId: string,
  userId: string,
  isPro: boolean
): Promise<CareerCardData> {
  const timeline = await getCareerTimeline(userId, riotAccountId);
  const { summary } = timeline;

  if (summary.totalGames === 0) throw new Error("NO_CAREER_YET");

  // Read from champion stats rather than parsing the era headline back out of its own
  // display string — a reworded title should not silently empty this field.
  const signature = await prisma.championStat.findFirst({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5" },
    orderBy: { gamesPlayed: "desc" },
    select: { gamesPlayed: true, champion: { select: { name: true } } },
  });

  // Prefer the best-game record: of everything a career produces it is the line a
  // person actually wants under their name. Falls back to whatever record exists.
  const records = timeline.bands
    .flatMap((band) => band.events)
    .filter((event) => event.kind === "record");
  const headline =
    (records.find((r) => r.id.startsWith("record:kda")) ?? records[0])?.detail ?? null;

  return {
    cardType: "career",
    gameName: summary.gameName,
    tagLine: summary.tagLine,
    summonerLevel: summary.summonerLevel,
    trackedFrom: summary.firstTrackedAt ?? "",
    totalGames: summary.totalGames,
    totalHours: summary.totalHours,
    currentRank: summary.currentRank ?? "Unranked",
    peakRank: summary.peakRank ?? "Unranked",
    signatureChampion: signature?.champion?.name ?? null,
    signatureChampionGames: signature?.gamesPlayed ?? 0,
    headline,
    isPro,
  };
}
