import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

export interface RetentionSignals {
  lossStreak: number;
  hasLossStreak: boolean; // ≥ 3 consecutive losses
  hasDeathSpike: boolean; // last 5 games avg deaths > 7-game avg * 1.3
  hasCsMinDrop: boolean; // this-week avg CS/min < last-week avg * 0.85
  hasTiltPattern: boolean; // ≥ 2 consecutive losses where next game started < 10 min after
  hasWideChampionPool: boolean; // > 5 unique champions in last 20 games, most < 3 games
  primaryNudge: string | null;
}

const TILT_REQUEUE_MS = 10 * 60 * 1000; // 10 minutes
const LOSS_STREAK_THRESHOLD = 3;
const DEATH_SPIKE_FACTOR = 1.3;
const CS_DROP_FACTOR = 0.85;
const WIDE_POOL_THRESHOLD = 5;

export async function computeRetentionSignals(riotAccountId: string): Promise<RetentionSignals> {
  const puuid = await getAccountPuuid(riotAccountId);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Last 20 ranked games ordered by date
  const recentMatches = await prisma.matchParticipant.findMany({
    // Queue and recency come off the participant row, not the relation, so this is one index
    // range scan rather than a walk back through `matches` discarding nine rows in ten (ADR-040).
    where: {
      puuid: puuid ?? "",
      queueType: "RANKED_SOLO_5x5",
    },
    orderBy: { gameStart: "desc" },
    take: 20,
    select: {
      won: true,
      deaths: true,
      csPerMinute: true,
      championName: true,
      match: { select: { gameStart: true, gameEnd: true } },
    },
  });

  if (recentMatches.length === 0) {
    return {
      lossStreak: 0,
      hasLossStreak: false,
      hasDeathSpike: false,
      hasCsMinDrop: false,
      hasTiltPattern: false,
      hasWideChampionPool: false,
      primaryNudge: null,
    };
  }

  // ── Loss streak ──────────────────────────────────────────────────────────
  let lossStreak = 0;
  for (const m of recentMatches) {
    if (!m.won) lossStreak++;
    else break;
  }
  const hasLossStreak = lossStreak >= LOSS_STREAK_THRESHOLD;

  // ── Death spike ──────────────────────────────────────────────────────────
  const avgDeaths7 = recentMatches.reduce((s, m) => s + m.deaths, 0) / recentMatches.length;
  const last5Deaths =
    recentMatches.slice(0, 5).reduce((s, m) => s + m.deaths, 0) / Math.min(5, recentMatches.length);
  const hasDeathSpike = last5Deaths > avgDeaths7 * DEATH_SPIKE_FACTOR && avgDeaths7 >= 2;

  // ── CS/min drop vs last week ─────────────────────────────────────────────
  const thisWeek = recentMatches.filter((m) => m.match.gameStart >= weekAgo);
  const lastWeekData = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      queueType: "RANKED_SOLO_5x5",
      gameStart: { gte: twoWeeksAgo, lt: weekAgo },
    },
    select: { csPerMinute: true },
  });

  const avgCsThis =
    thisWeek.length > 0
      ? thisWeek.reduce((s, m) => s + Number(m.csPerMinute), 0) / thisWeek.length
      : null;
  const avgCsLast =
    lastWeekData.length > 0
      ? lastWeekData.reduce((s, m) => s + Number(m.csPerMinute), 0) / lastWeekData.length
      : null;
  const hasCsMinDrop =
    avgCsThis !== null && avgCsLast !== null ? avgCsThis < avgCsLast * CS_DROP_FACTOR : false;

  // ── Tilt pattern: loss + requeue within 10 min ───────────────────────────
  let tiltCount = 0;
  const ordered = [...recentMatches].reverse(); // oldest first
  for (let i = 0; i < ordered.length - 1; i++) {
    const current = ordered[i];
    const next = ordered[i + 1];
    if (
      !current.won &&
      next.match.gameStart.getTime() - current.match.gameEnd.getTime() < TILT_REQUEUE_MS
    ) {
      tiltCount++;
    }
  }
  const hasTiltPattern = tiltCount >= 2;

  // ── Wide champion pool ───────────────────────────────────────────────────
  const champCounts = new Map<string, number>();
  for (const m of recentMatches) {
    champCounts.set(m.championName, (champCounts.get(m.championName) ?? 0) + 1);
  }
  const uniqueChamps = champCounts.size;
  const champsWithFewGames = [...champCounts.values()].filter((n) => n < 3).length;
  const hasWideChampionPool =
    uniqueChamps > WIDE_POOL_THRESHOLD && champsWithFewGames >= uniqueChamps * 0.6;

  // ── Primary nudge ────────────────────────────────────────────────────────
  let primaryNudge: string | null = null;
  if (hasTiltPattern || (hasLossStreak && lossStreak >= 5)) {
    primaryNudge = "stop_queuing";
  } else if (hasWideChampionPool) {
    primaryNudge = "pool_too_wide";
  } else if (hasLossStreak) {
    primaryNudge = "loss_streak";
  } else if (hasDeathSpike) {
    primaryNudge = "death_spike";
  } else if (hasCsMinDrop) {
    primaryNudge = "cs_drop";
  }

  return {
    lossStreak,
    hasLossStreak,
    hasDeathSpike,
    hasCsMinDrop,
    hasTiltPattern,
    hasWideChampionPool,
    primaryNudge,
  };
}

export const NUDGE_MESSAGES: Record<string, string> = {
  stop_queuing:
    "Your data shows a tilt pattern — you're requeuing too fast after losses. Take a 30-minute break to reset.",
  pool_too_wide:
    "You're spreading games across too many champions. Pick 2-3 and master them to climb faster.",
  loss_streak:
    "You're on a loss streak. Review your last 3 games for the common mistake before queuing again.",
  death_spike:
    "Your deaths have spiked recently. Focus on playing safer — fewer deaths is the fastest way to improve.",
  cs_drop:
    "Your CS/min is lower than last week. Spend 10 minutes in practice tool before your next session.",
};
