import { meetsTarget, type MatchReading } from "@/domains/academy/verification";
import type { FieldAssignment } from "@/domains/academy/types";

// Mastery decays, and the decay is measured rather than timed — see
// docs/adr/ADR-027-academy-mastery-lifecycle.md. Duolingo fades a skill on a clock because it
// cannot see whether you still speak the language. We can see the ranked games, so a player
// who has held the habit for a year is never sent back.
//
// Prisma-free on purpose, like placement.ts and verification.ts: the rules are testable against
// plain objects and the service does the reading.

/** How long a mastered lesson stands before it is measured again. */
export const DECAY_CHECK_DAYS = 21;

export type DecayVerdict = "holding" | "decayed" | "unmeasured";

/** Due when nothing has judged it for the window — from the last check, or from mastery. */
export function isDecayDue(masteredAt: Date, decayCheckedAt: Date | null, now: Date): boolean {
  const since = decayCheckedAt ?? masteredAt;
  return (now.getTime() - since.getTime()) / 86_400_000 >= DECAY_CHECK_DAYS;
}

export interface DecayInput {
  direction: FieldAssignment["direction"];
  /** The number the assignment already passed against. Never re-derived. */
  target: number;
  gamesRequired: number;
  /** The player's most recent qualifying games in the assignment's role, newest first. */
  readings: MatchReading[];
}

/**
 * Re-asks the question the assignment already answered, against the same target. Two rules
 * carry all the meaning:
 *
 * - The target is the stored one. Measuring against a fresh baseline would move the goalposts
 *   every time the player improved, so mastering a lesson would quietly get harder to keep.
 * - Too few games is `unmeasured`, not `decayed`. Silence is not regression, and demoting
 *   somebody for not playing punishes the wrong thing.
 */
export function judgeDecay({ direction, target, gamesRequired, readings }: DecayInput): DecayVerdict {
  const counted = readings.slice(0, gamesRequired);
  if (counted.length < gamesRequired) return "unmeasured";

  const average = counted.reduce((sum, r) => sum + r.value, 0) / counted.length;
  return meetsTarget(direction, average, target) ? "holding" : "decayed";
}
