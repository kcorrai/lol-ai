import type { BookingStatus, QueueType, SessionGoalMetric } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { GOAL_METRICS, metGoal, metricValue, validTarget } from "@/domains/marketplace/goalMetrics";

// Goals a coach sets after a session, and how the student is doing on them.
//
// This is the learning loop the rest of the category does not have: a tutoring
// platform can only ask a student whether they practised. We hold the games, so
// progress is read from the ranked matches played after the goal was set — no
// AI, no Riot call, just the student's own stored games on the account they
// attached to the booking.

export const MAX_GOALS = 3;
/** Progress runs over the first games after the goal — a short, finishable challenge. */
export const GOAL_WINDOW_GAMES = 10;

const RANKED: QueueType[] = ["RANKED_SOLO_5x5", "RANKED_FLEX_SR"];
/** A goal comes out of a session, so it can be set once the session is agreed. */
const GOALS_OPEN: BookingStatus[] = ["CONFIRMED", "DELIVERED", "COMPLETED"];

export interface GoalInput {
  metric: SessionGoalMetric;
  target: number;
}

export interface GoalView {
  metric: SessionGoalMetric;
  label: string;
  unit: string;
  direction: "min" | "max";
  target: number;
  /** Games in the window that met it. */
  hits: number;
}

export interface GoalGame {
  matchId: string;
  championName: string;
  gameStart: string;
  results: Partial<Record<SessionGoalMetric, { value: number; met: boolean }>>;
}

export interface GoalProgress {
  goals: GoalView[];
  /** False when no Riot account was attached to the booking — nothing to measure against. */
  tracked: boolean;
  games: GoalGame[];
  window: number;
}

export type SetGoalsOutcome =
  | { ok: true }
  | { ok: false; reason: "not-found" | "not-open" | "invalid" };

/** Replace a booking's goals. Only its coach may, and only once the session is agreed. */
export async function setGoals(
  bookingId: string,
  coachUserId: string,
  goals: GoalInput[]
): Promise<SetGoalsOutcome> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, coachProfile: { userId: coachUserId } },
    select: { id: true, status: true },
  });
  if (!booking) return { ok: false, reason: "not-found" };
  if (!GOALS_OPEN.includes(booking.status)) return { ok: false, reason: "not-open" };

  const metrics = goals.map((g) => g.metric);
  const valid =
    goals.length <= MAX_GOALS &&
    new Set(metrics).size === metrics.length &&
    goals.every((g) => validTarget(g.metric, g.target));
  if (!valid) return { ok: false, reason: "invalid" };

  // Upsert rather than replace: a goal whose target is only adjusted keeps its
  // start date, so the games already counted towards it still count.
  await prisma.$transaction([
    prisma.sessionGoal.deleteMany({ where: { bookingId, metric: { notIn: metrics } } }),
    ...goals.map((g) =>
      prisma.sessionGoal.upsert({
        where: { bookingId_metric: { bookingId, metric: g.metric } },
        create: { bookingId, metric: g.metric, target: g.target },
        update: { target: g.target },
      })
    ),
  ]);

  return { ok: true };
}

/** A booking's goals and the student's games against them. Either side of the booking may read. */
export async function goalProgress(
  bookingId: string,
  userId: string
): Promise<GoalProgress | null> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, OR: [{ studentId: userId }, { coachProfile: { userId } }] },
    select: {
      riotAccount: { select: { puuid: true } },
      goals: {
        select: { metric: true, target: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!booking) return null;

  const empty = (tracked: boolean): GoalProgress => ({
    goals: booking.goals.map((g) => view(g.metric, g.target, 0)),
    tracked,
    games: [],
    window: GOAL_WINDOW_GAMES,
  });
  if (booking.goals.length === 0 || !booking.riotAccount)
    return empty(Boolean(booking.riotAccount));

  const since = booking.goals[0].createdAt;
  const rows = await prisma.matchParticipant.findMany({
    where: {
      puuid: booking.riotAccount.puuid,
      queueType: { in: RANKED },
      gameStart: { gt: since },
    },
    orderBy: { gameStart: "asc" },
    take: GOAL_WINDOW_GAMES,
    select: {
      championName: true,
      gameStart: true,
      kills: true,
      deaths: true,
      assists: true,
      csPerMinute: true,
      visionScore: true,
      match: { select: { matchId: true, gameDuration: true } },
    },
  });

  const games: GoalGame[] = rows.map((row) => {
    const line = {
      kills: row.kills,
      deaths: row.deaths,
      assists: row.assists,
      csPerMinute: Number(row.csPerMinute),
      visionScore: row.visionScore,
      durationSeconds: row.match.gameDuration,
    };
    const results: GoalGame["results"] = {};
    for (const goal of booking.goals) {
      // A goal added later only counts the games played after it was set.
      if (row.gameStart <= goal.createdAt) continue;
      results[goal.metric] = {
        value: metricValue(goal.metric, line),
        met: metGoal(goal.metric, goal.target, line),
      };
    }
    return {
      matchId: row.match.matchId,
      championName: row.championName,
      gameStart: row.gameStart.toISOString(),
      results,
    };
  });

  return {
    goals: booking.goals.map((g) =>
      view(g.metric, g.target, games.filter((game) => game.results[g.metric]?.met).length)
    ),
    tracked: true,
    games,
    window: GOAL_WINDOW_GAMES,
  };
}

function view(metric: SessionGoalMetric, target: number, hits: number): GoalView {
  const rule = GOAL_METRICS[metric];
  return { metric, label: rule.label, unit: rule.unit, direction: rule.direction, target, hits };
}
