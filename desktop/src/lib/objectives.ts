import type { Team } from "./liveClient/schema";
import type { TimelineEntry, TimelineKind } from "./timeline";

/**
 * What each side has taken, counted off the event stream.
 *
 * This is the panel that stands where the design put a map. The Live Client Data API
 * publishes no coordinates — not for the player, not for anyone — so a map with anything
 * marked on it would be a drawing of positions this app invented. What the stream *does*
 * carry is every objective that fell and who took it, which is the half of "where it is
 * happening" that is actually knowable from here.
 *
 * Everything counted is something the player watched happen. Nothing is predicted, and no
 * respawn or spawn timer appears anywhere near it — the same rule the timeline holds to, for
 * the same reason: this repository has no verified table of patch constants, and a
 * confidently wrong countdown over a running game is worse than no panel.
 */

/** The objectives worth a row, in the order a scoreboard lists them. */
export const OBJECTIVES = ["dragon", "herald", "baron", "turret", "inhibitor"] as const;
export type Objective = (typeof OBJECTIVES)[number];

export type ObjectiveTally = Record<Objective, number>;

export interface ObjectiveCount {
  ORDER: ObjectiveTally;
  CHAOS: ObjectiveTally;
}

function empty(): ObjectiveTally {
  return { dragon: 0, herald: 0, baron: 0, turret: 0, inhibitor: 0 };
}

/** Only the kinds this panel counts. A kill or an ace is not an objective. */
function objectiveOf(kind: TimelineKind): Objective | null {
  return (OBJECTIVES as readonly string[]).includes(kind) ? (kind as Objective) : null;
}

/**
 * Both sides' objectives, from the timeline this screen already has.
 *
 * Built from `TimelineEntry` rather than from the raw events, so the panel counts exactly the
 * rows the timeline beside it draws. Two readings of the same stream that disagreed would be
 * the worse bug: the player can see both at once.
 *
 * An entry whose side could not be worked out is counted for neither. That happens for real —
 * a turret taken by minions has no killer to match against the player list — and guessing a
 * side from nothing would put a point on a scoreboard that nobody scored.
 */
export function countObjectives(entries: readonly TimelineEntry[]): ObjectiveCount {
  const count: ObjectiveCount = { ORDER: empty(), CHAOS: empty() };

  for (const entry of entries) {
    const objective = objectiveOf(entry.kind);
    if (!objective || !entry.team) continue;
    count[entry.team][objective] += 1;
  }

  return count;
}

/**
 * How far along a two-sided bar one side's share sits, 0–100.
 *
 * Fifty when neither side has taken any, which is the honest reading of nil-nil rather than
 * an empty bar that looks like a side has lost something it never had.
 */
export function share(mine: number, theirs: number): number {
  const total = mine + theirs;
  if (total === 0) return 50;
  return (mine / total) * 100;
}

/** Which side the player is on, for a panel that reads "us" and "them" rather than by name. */
export function otherTeam(team: Team): Team {
  return team === "ORDER" ? "CHAOS" : "ORDER";
}
