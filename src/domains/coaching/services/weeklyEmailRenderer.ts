import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import {
  computeRetentionSignals,
  NUDGE_MESSAGES,
} from "@/domains/analysis/services/retentionService";

// ── Pure helpers (exported for testing) ─────────────────────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Returns ISO 8601 year-week string e.g. "2026-W23".
// Used as the idempotency key suffix so each user gets at most one email per week.
export function getIsoWeekKey(date: Date): string {
  const d = new Date(date.getTime());
  d.setUTCHours(0, 0, 0, 0);
  // Move to the Thursday of the same ISO week (ISO weeks start Monday, pivot on Thursday)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function lpComposite(tier: string, division: string, lp: number): number {
  const tierIndex: Record<string, number> = {
    IRON: 0,
    BRONZE: 1,
    SILVER: 2,
    GOLD: 3,
    PLATINUM: 4,
    EMERALD: 5,
    DIAMOND: 6,
    MASTER: 7,
    GRANDMASTER: 8,
    CHALLENGER: 9,
  };
  const divIndex: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };
  return (tierIndex[tier] ?? 0) * 400 + (divIndex[division] ?? 0) * 100 + lp;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyStats {
  gamesPlayed: number;
  wins: number;
  lpChange: number | null;
  csMinChange: number | null;
  biggestWeakness: string | null;
  topChampion: string | null;
  smartNudge: string | null;
  isPro: boolean;
  gameName: string;
  appUrl: string;
}

// ── Data builder ─────────────────────────────────────────────────────────────

// gameName and isPro are pre-fetched in the batch query to avoid N+1 per user.
// now is injected so time windows are consistent across the batch and testable.
export async function buildWeeklyStats(
  riotAccountId: string,
  gameName: string,
  isPro: boolean,
  now: Date
): Promise<WeeklyStats | null> {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const puuid = await getAccountPuuid(riotAccountId);

  const thisWeekParticipants = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: weekAgo } },
    },
    select: { won: true, csPerMinute: true },
  });

  if (thisWeekParticipants.length === 0) return null;

  const gamesPlayed = thisWeekParticipants.length;
  const wins = thisWeekParticipants.filter((p) => p.won).length;

  const lastWeekParticipants = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      match: {
        queueType: "RANKED_SOLO_5x5",
        gameStart: { gte: twoWeeksAgo, lt: weekAgo },
      },
    },
    select: { csPerMinute: true },
  });

  const avgCs = (arr: { csPerMinute: unknown }[]) =>
    arr.length === 0 ? null : arr.reduce((s, p) => s + Number(p.csPerMinute), 0) / arr.length;

  const thisCs = avgCs(thisWeekParticipants);
  const prevCs = avgCs(lastWeekParticipants);
  const csMinChange =
    thisCs !== null && prevCs !== null ? Math.round((thisCs - prevCs) * 10) / 10 : null;

  const latestRank = await prisma.rankedHistory.findFirst({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5" },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });
  const weekStartRank = await prisma.rankedHistory.findFirst({
    where: {
      riotAccountId,
      queueType: "RANKED_SOLO_5x5",
      recordedAt: { lte: weekAgo },
    },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });

  const lpChange =
    latestRank && weekStartRank
      ? lpComposite(latestRank.tier, latestRank.division, latestRank.lp) -
        lpComposite(weekStartRank.tier, weekStartRank.division, weekStartRank.lp)
      : null;

  const lastReport = await prisma.coachingReport.findFirst({
    where: { riotAccountId, status: "complete" },
    orderBy: { completedAt: "desc" },
    select: { weaknesses: true, championRecommendations: true },
  });

  const weaknesses = lastReport?.weaknesses as
    | Array<{ area: string; priority: string }>
    | null
    | undefined;
  const biggestWeakness =
    weaknesses?.find((w) => w.priority === "high")?.area ?? weaknesses?.[0]?.area ?? null;

  const championRecs = lastReport?.championRecommendations as
    | Array<{ championName: string; priority: string }>
    | null
    | undefined;
  const topChampion =
    championRecs?.find((c) => c.priority === "high")?.championName ??
    championRecs?.[0]?.championName ??
    null;

  const signals = await computeRetentionSignals(riotAccountId);
  const smartNudge = signals.primaryNudge ? (NUDGE_MESSAGES[signals.primaryNudge] ?? null) : null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

  return {
    gamesPlayed,
    wins,
    lpChange,
    csMinChange,
    biggestWeakness,
    topChampion,
    smartNudge,
    isPro,
    gameName,
    appUrl,
  };
}
