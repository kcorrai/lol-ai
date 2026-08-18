import type { Position } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid, listAccounts } from "@/domains/riot";
import { metricValue, type MatchReading } from "@/domains/academy/verification";
import type { AssignmentMetric } from "@/domains/academy/types";

// The match-data half of Proof of Practice: everything that turns a player's synced games into
// the single number an assignment is judged on. Kept apart from the assignment lifecycle so the
// two filters that make the numbers comparable live in one place.

// A field assignment is only meaningful against ranked games — the habits these lessons teach do
// not apply in ARAM, and counting them would let a player pass by not playing the mode the
// assignment is about.
export const COUNTED_QUEUES = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"] as const;

/** How many recent ranked games the baseline is averaged over. */
const BASELINE_SAMPLE = 20;

/**
 * Below this there is no honest baseline to set a target from, so no assignment is opened.
 * A target guessed from one game is worse than no target at all.
 */
const MIN_BASELINE_GAMES = 3;

export interface ReadingQuery {
  puuid: string;
  metric: AssignmentMetric;
  /** Omitted for a baseline, which looks backwards instead of forwards. */
  since?: Date;
  /** Omitted only for the sample the primary role is derived from. */
  position?: Position;
  limit: number;
  order: "asc" | "desc";
}

export async function loadReadings({
  puuid,
  metric,
  since,
  position,
  limit,
  order,
}: ReadingQuery): Promise<MatchReading[]> {
  const rows = await prisma.matchParticipant.findMany({
    where: {
      puuid,
      ...(position ? { position } : {}),
      match: {
        queueType: { in: [...COUNTED_QUEUES] },
        ...(since ? { gameStart: { gt: since } } : {}),
      },
    },
    select: {
      kills: true,
      deaths: true,
      assists: true,
      csPerMinute: true,
      visionScore: true,
      teamId: true,
      match: {
        select: { id: true, gameStart: true, participants: { select: { teamId: true, kills: true } } },
      },
    },
    orderBy: { match: { gameStart: order } },
    take: limit,
  });

  return rows.map((row) => ({
    matchId: row.match.id,
    playedAt: row.match.gameStart.toISOString(),
    value: metricValue(metric, {
      kills: row.kills,
      deaths: row.deaths,
      assists: row.assists,
      csPerMinute: Number(row.csPerMinute),
      visionScore: row.visionScore,
      teamKills: row.match.participants
        .filter((p) => p.teamId === row.teamId)
        .reduce((sum, p) => sum + p.kills, 0),
    }),
  }));
}

export async function primaryRiotAccountId(userId: string): Promise<string | null> {
  const accounts = await listAccounts(userId).catch(() => []);
  if (accounts.length === 0) return null;
  return (accounts.find((a) => a.isPrimary) ?? accounts[0]).id;
}

/** The role the player has been queuing most in recently — the one the assignment is about. */
async function primaryPosition(puuid: string): Promise<Position | null> {
  const rows = await prisma.matchParticipant.findMany({
    where: { puuid, match: { queueType: { in: [...COUNTED_QUEUES] } } },
    select: { position: true },
    orderBy: { match: { gameStart: "desc" } },
    take: BASELINE_SAMPLE,
  });
  if (rows.length === 0) return null;

  const counts = new Map<Position, number>();
  for (const row of rows) counts.set(row.position, (counts.get(row.position) ?? 0) + 1);

  // Ties break toward the most recent game, which is the role they are playing now.
  let best = rows[0].position;
  for (const [position, count] of counts) {
    if (count > (counts.get(best) ?? 0)) best = position;
  }
  return best;
}

/**
 * The same reading, from a linked account rather than a puuid. The Academy hub needs it to
 * decide which role path is the player's own, which is a question about them and not about
 * any one assignment.
 */
export async function primaryPositionForAccount(riotAccountId: string): Promise<Position | null> {
  const puuid = await getAccountPuuid(riotAccountId).catch(() => null);
  return puuid ? primaryPosition(puuid) : null;
}

export interface Baseline {
  value: number;
  position: Position;
}

/**
 * The player's current value for a metric, averaged over their recent ranked games **in their
 * main role** — the same population the verdict will be read from. Null when there are too few
 * to be honest about.
 *
 * Two filters, both learned the hard way against real data. Not `getPlayerPerformanceProfile`,
 * which averages the last 20 matches of any queue: an ARAM-inclusive baseline against a
 * ranked-only verdict is unreachable for some players and free for others. And not role-blind:
 * one account averaged 4.1 CS/min across mid and support games while the three games that would
 * have judged it were all support, at 0.85.
 */
export async function rankedBaseline(
  userId: string,
  metric: AssignmentMetric
): Promise<Baseline | null> {
  const riotAccountId = await primaryRiotAccountId(userId);
  if (!riotAccountId) return null;

  const puuid = await getAccountPuuid(riotAccountId).catch(() => null);
  if (!puuid) return null;

  const position = await primaryPosition(puuid);
  if (!position) return null;

  const readings = await loadReadings({
    puuid,
    metric,
    position,
    limit: BASELINE_SAMPLE,
    order: "desc",
  });
  if (readings.length < MIN_BASELINE_GAMES) return null;

  return {
    value: readings.reduce((sum, r) => sum + r.value, 0) / readings.length,
    position,
  };
}
