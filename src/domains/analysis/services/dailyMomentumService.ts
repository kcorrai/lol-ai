import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot";
import { buildDailySeries, type DailyPoint, type MomentumRow } from "./dailyMomentum";
import { getActiveDuo } from "./duoService";

export interface DuoSeries {
  gameName: string;
  tagLine: string;
  points: DailyPoint[];
}

export interface DailyMomentum {
  days: number;
  self: DailyPoint[];
  duo: DuoSeries | null;
}

export const DEFAULT_WINDOW_DAYS = 30;
const MAX_WINDOW_DAYS = 90;

const MOMENTUM_FIELDS = {
  kills: true,
  deaths: true,
  assists: true,
  csPerMinute: true,
  visionScore: true,
  won: true,
  matchId: true,
  match: { select: { gameStart: true } },
} as const;

type RawRow = {
  kills: number;
  deaths: number;
  assists: number;
  csPerMinute: unknown; // Prisma Decimal
  visionScore: number;
  won: boolean;
  matchId: string;
  match: { gameStart: Date };
};

const toMomentumRow = (r: RawRow): MomentumRow => ({
  gameStart: r.match.gameStart,
  kills: r.kills,
  deaths: r.deaths,
  assists: r.assists,
  csPerMinute: Number(r.csPerMinute),
  visionScore: r.visionScore,
  won: r.won,
});

/**
 * Day-by-day performance for the player, plus their duo when one is set.
 *
 * The duo's series covers only the matches the two shared — those are the only games we hold
 * participant rows for, so it reads as "how we're doing together", not as a second solo career.
 */
export async function getDailyMomentum(
  riotAccountId: string,
  days: number = DEFAULT_WINDOW_DAYS
): Promise<DailyMomentum> {
  const window = Math.min(Math.max(days, 1), MAX_WINDOW_DAYS);
  const puuid = await getAccountPuuid(riotAccountId);
  if (!puuid) return { days: window, self: [], duo: null };

  const since = new Date(Date.now() - window * 24 * 60 * 60 * 1000);

  const ownRows = (await prisma.matchParticipant.findMany({
    where: { puuid, match: { gameStart: { gte: since } } },
    select: MOMENTUM_FIELDS,
    orderBy: { match: { gameStart: "asc" } },
  })) as RawRow[];

  const self = buildDailySeries(ownRows.map(toMomentumRow));

  const duo = await getActiveDuo(riotAccountId);
  if (!duo) return { days: window, self, duo: null };

  // Restricted to the player's own matches, so this is the duo's record in their shared games.
  const duoRows = (await prisma.matchParticipant.findMany({
    where: { puuid: duo.puuid, matchId: { in: ownRows.map((r) => r.matchId) } },
    select: MOMENTUM_FIELDS,
    orderBy: { match: { gameStart: "asc" } },
  })) as RawRow[];

  return {
    days: window,
    self,
    duo: {
      gameName: duo.gameName,
      tagLine: duo.tagLine,
      points: buildDailySeries(duoRows.map(toMomentumRow)),
    },
  };
}
