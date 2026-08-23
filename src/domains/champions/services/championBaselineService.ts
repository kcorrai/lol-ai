import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

/**
 * What this account normally does on one champion — four averages and the sample they
 * came from.
 *
 * This exists rather than reusing `getChampionDeepDive` because of where it is called
 * from: the desktop companion asks for it at the start of a match, and the deep dive
 * calls a language model whenever its cached summary has gone stale. A round trip to a
 * model in the one minute a player cannot spare is exactly what the companion's design
 * forbids (ADR-038). This is one query and no model, ever.
 *
 * Deliberately narrower than the deep dive in the other direction too: no recent games,
 * no death clustering, no image. A live panel shows four numbers.
 */
export interface ChampionBaseline {
  championName: string;
  /** How many games these averages are made of. Never rendered without it. */
  games: number;
  csPerMin: number;
  deaths: number;
  visionScore: number;
  kda: number;
}

/**
 * Ranked solo only, and named as such wherever it is shown.
 *
 * Mixing queues would produce an average that is true of no queue: ARAM has no lane to
 * farm and normals are not played the same way. The caller is responsible for not
 * putting this number beside a game it does not describe.
 */
const QUEUE = "RANKED_SOLO_5x5";

/** Enough to be a habit rather than a run of luck, few enough to still be *recent*. */
const SAMPLE = 20;

/**
 * Fewer than this and the average is a story about three games. The companion renders
 * the live numbers alone in that case rather than inventing something to compare them to.
 */
export const MIN_BASELINE_GAMES = 5;

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function round(value: number, places: number): number {
  return Number(value.toFixed(places));
}

/** Null when this account has not played the champion enough for an average to mean anything. */
export async function getChampionBaseline(
  riotAccountId: string,
  championName: string
): Promise<ChampionBaseline | null> {
  const puuid = await getAccountPuuid(riotAccountId);
  if (!puuid) return null;

  const games = await prisma.matchParticipant.findMany({
    where: { puuid, championName, match: { queueType: QUEUE } },
    orderBy: { match: { gameStart: "desc" } },
    take: SAMPLE,
    select: {
      kills: true,
      deaths: true,
      assists: true,
      csPerMinute: true,
      visionScore: true,
    },
  });

  if (games.length < MIN_BASELINE_GAMES) return null;

  return {
    championName,
    games: games.length,
    csPerMin: round(avg(games.map((g) => Number(g.csPerMinute))), 1),
    deaths: round(avg(games.map((g) => g.deaths)), 1),
    visionScore: round(avg(games.map((g) => g.visionScore)), 1),
    kda: round(
      avg(games.map((g) => (g.kills + g.assists) / Math.max(g.deaths, 1))),
      2
    ),
  };
}
