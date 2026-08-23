import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

export type WarmupStatus = "warmed_up" | "no_warmup" | "no_ranked_today";

export interface WarmupData {
  status: WarmupStatus;
  warmupGames: number;
  firstRankedResult: "win" | "loss" | null;
  // Historical: win rate in first ranked game with vs without warm-up (last 30 days)
  withWarmupWinRate: number | null;
  withoutWarmupWinRate: number | null;
  message: string;
}

const WARMUP_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours
const RANKED_QUEUES = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"] as const;
const WARMUP_QUEUES = ["NORMAL_BLIND", "NORMAL_DRAFT", "ARAM"] as const;

const MESSAGES: Record<WarmupStatus, (warmupGames: number) => string> = {
  warmed_up: (n) =>
    `${n} warm-up game${n !== 1 ? "s" : ""} before ranked. Good habit — keep it up.`,
  no_warmup: () =>
    "No warm-up before ranked today. A few normals or ARAMs first improves early-game focus.",
  no_ranked_today: () => "No ranked games today yet.",
};

export async function getWarmupStatus(riotAccountId: string): Promise<WarmupData> {
  const puuid = await getAccountPuuid(riotAccountId);
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // All of today's matches ordered oldest first
  const todayMatches = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      match: { gameStart: { gte: todayStart } },
    },
    orderBy: { match: { gameStart: "asc" } },
    select: {
      won: true,
      match: { select: { gameStart: true, queueType: true } },
    },
  });

  const firstRanked = todayMatches.find((m) =>
    RANKED_QUEUES.includes(m.match.queueType as (typeof RANKED_QUEUES)[number])
  );

  if (!firstRanked) {
    return {
      status: "no_ranked_today",
      warmupGames: 0,
      firstRankedResult: null,
      withWarmupWinRate: null,
      withoutWarmupWinRate: null,
      message: MESSAGES.no_ranked_today(0),
    };
  }

  const firstRankedTime = firstRanked.match.gameStart.getTime();
  const windowStart = firstRankedTime - WARMUP_WINDOW_MS;

  // Non-ranked games played within 2h before first ranked
  const warmupGames = todayMatches.filter((m) => {
    const t = m.match.gameStart.getTime();
    return (
      WARMUP_QUEUES.includes(m.match.queueType as (typeof WARMUP_QUEUES)[number]) &&
      t >= windowStart &&
      t < firstRankedTime
    );
  });

  const status: WarmupStatus = warmupGames.length > 0 ? "warmed_up" : "no_warmup";
  const firstRankedResult = firstRanked.won ? "win" : "loss";

  // ── Historical comparison (last 30 days) ────────────────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get all ranked games from the past 30 days grouped by calendar day
  const historicalRanked = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: thirtyDaysAgo } },
    },
    orderBy: { match: { gameStart: "asc" } },
    select: { won: true, match: { select: { gameStart: true } } },
  });

  const historicalWarmup = await prisma.matchParticipant.findMany({
    where: {
      puuid: puuid ?? "",
      match: {
        queueType: { in: [...WARMUP_QUEUES] },
        gameStart: { gte: thirtyDaysAgo },
      },
    },
    select: { match: { select: { gameStart: true } } },
  });

  // Group ranked first-game-of-day by whether warmup existed before it
  const warmupGameTimes = historicalWarmup.map((m) => m.match.gameStart.getTime());

  const dayMap = new Map<string, { firstGame: { time: number; won: boolean } }>();
  for (const m of historicalRanked) {
    const day = m.match.gameStart.toISOString().slice(0, 10);
    if (!dayMap.has(day)) {
      dayMap.set(day, { firstGame: { time: m.match.gameStart.getTime(), won: m.won } });
    }
  }

  let withWarmupWins = 0,
    withWarmupTotal = 0;
  let withoutWarmupWins = 0,
    withoutWarmupTotal = 0;

  for (const { firstGame } of dayMap.values()) {
    const hadWarmup = warmupGameTimes.some(
      (t) => t >= firstGame.time - WARMUP_WINDOW_MS && t < firstGame.time
    );
    if (hadWarmup) {
      withWarmupTotal++;
      if (firstGame.won) withWarmupWins++;
    } else {
      withoutWarmupTotal++;
      if (firstGame.won) withoutWarmupWins++;
    }
  }

  const withWarmupWinRate =
    withWarmupTotal >= 3 ? Math.round((withWarmupWins / withWarmupTotal) * 100) : null;
  const withoutWarmupWinRate =
    withoutWarmupTotal >= 3 ? Math.round((withoutWarmupWins / withoutWarmupTotal) * 100) : null;

  return {
    status,
    warmupGames: warmupGames.length,
    firstRankedResult,
    withWarmupWinRate,
    withoutWarmupWinRate,
    message: MESSAGES[status](warmupGames.length),
  };
}
