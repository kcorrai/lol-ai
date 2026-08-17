import type { AssignmentMetric, FieldAssignment } from "@/domains/academy/types";

// Proof of Practice, judged. A lesson's field assignment is a claim about the player's next
// few ranked games; this module is the referee. Kept free of Prisma so the rules can be tested
// against plain objects — same split as placement.ts and recommendation.ts.

/** An assignment that never collects its games has to end somewhere. */
export const ASSIGNMENT_EXPIRY_DAYS = 14;

/** One qualifying match, reduced to the single number the assignment cares about. */
export interface MatchReading {
  matchId: string;
  playedAt: string;
  value: number;
}

/** The per-match columns any metric can be derived from. */
export interface MatchStatRow {
  kills: number;
  deaths: number;
  assists: number;
  csPerMinute: number;
  visionScore: number;
  /** Total kills for the player's side — kill participation is meaningless without it. */
  teamKills: number;
}

export function metricValue(metric: AssignmentMetric, row: MatchStatRow): number {
  switch (metric) {
    case "csPerMinute":
      return row.csPerMinute;
    case "visionScore":
      return row.visionScore;
    case "deathsPerGame":
      return row.deaths;
    case "kda":
      return (row.kills + row.assists) / Math.max(row.deaths, 1);
    case "killParticipation":
      // A game where the team scored nothing tells us nothing about participation, so it
      // reads as zero rather than dividing by zero.
      return row.teamKills === 0 ? 0 : ((row.kills + row.assists) / row.teamKills) * 100;
  }
}

export type AssignmentOutcome = "pending" | "passed" | "failed" | "expired";

export interface JudgeInput {
  direction: FieldAssignment["direction"];
  target: number;
  gamesRequired: number;
  /** Qualifying matches played after the assignment started, oldest first. */
  readings: MatchReading[];
  startedAt: Date;
  now: Date;
}

export interface Judgement {
  outcome: AssignmentOutcome;
  gamesObserved: number;
  /** Mean over the counted games, or null while the assignment is still collecting them. */
  average: number | null;
  counted: MatchReading[];
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function expired(startedAt: Date, now: Date): boolean {
  const days = (now.getTime() - startedAt.getTime()) / 86_400_000;
  return days > ASSIGNMENT_EXPIRY_DAYS;
}

/**
 * Judges an assignment on the **first** `gamesRequired` qualifying games, averaged. Averaging
 * matches how the baseline was built (`avgMetrics`), so the comparison is like for like — and
 * taking the first N rather than the best N is what makes it a commitment instead of a
 * highlight reel.
 */
export function judgeAssignment(input: JudgeInput): Judgement {
  const { direction, target, gamesRequired, readings, startedAt, now } = input;
  const counted = readings.slice(0, gamesRequired);

  if (counted.length < gamesRequired) {
    return {
      outcome: expired(startedAt, now) ? "expired" : "pending",
      gamesObserved: counted.length,
      average: null,
      counted,
    };
  }

  const average = mean(counted.map((r) => r.value));
  const met = direction === "increase" ? average >= target : average <= target;

  return {
    outcome: met ? "passed" : "failed",
    gamesObserved: counted.length,
    average,
    counted,
  };
}

/** What gets written to `academy_assignments.evidence` — the receipt for the verdict. */
export interface AssignmentEvidence {
  average: number;
  counted: MatchReading[];
}

export function buildEvidence(judgement: Judgement): AssignmentEvidence | null {
  return judgement.average === null
    ? null
    : { average: judgement.average, counted: judgement.counted };
}
