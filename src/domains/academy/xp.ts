// What a lesson is worth in XP, and the rule that stops it paying twice.
//
// Deliberately no streak: LaneIQ Daily already owns the only streak counter in the product, and
// two of them read to a player as two separate debts. Academy pays XP and nothing else.

/** Passing the drills. You read it. */
export const COMPLETION_XP = 40;

/** Holding the target in your own ranked games. You did it — worth three times the reading. */
export const MASTERY_XP = 120;

export type EarningStatus = "completed" | "mastered";

/** The running total a lesson has earned by the time it reaches a status. */
export function xpEarnedAt(status: EarningStatus): number {
  return status === "mastered" ? COMPLETION_XP + MASTERY_XP : COMPLETION_XP;
}

/**
 * How much to grant now, given what this lesson has already paid out. Stored as a total rather
 * than a pair of flags so the arithmetic answers every path on its own:
 *
 * - complete, then master → 40 then 120.
 * - decay to `review`, redo, complete again → nothing. XP is not clawed back when a mastery
 *   decays, so re-earning it must not pay a second time.
 * - master again after a redo → nothing, for the same reason.
 */
export function xpToAward(alreadyAwarded: number, status: EarningStatus): number {
  return Math.max(0, xpEarnedAt(status) - alreadyAwarded);
}
