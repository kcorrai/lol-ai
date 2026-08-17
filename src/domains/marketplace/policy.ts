import type { SessionKind } from "@prisma/client";

// The marketplace's rules, as numbers in one place.
//
// Everything here is snapshotted onto a booking when it is created rather than
// read back at settlement time. A rate that changes must not rewrite what an
// already-agreed session was worth, and a cancellation window that we shorten
// must not retroactively strand someone who booked under the old one.

/** Platform cut in basis points. 2000 = 20%. Per-coach overrides live on the profile. */
export const DEFAULT_COMMISSION_BPS = 2000;

/**
 * How long a coach has to accept a request before it expires itself.
 *
 * Matching the one number the incumbents agree on. The alternative — leaving a
 * request open — is the failure students complain about most: money committed
 * against a session nobody has agreed to run.
 */
export const COACH_RESPONSE_HOURS = 48;

/** Default notice a student must give to cancel without penalty. Coaches may raise it. */
export const DEFAULT_CANCELLATION_HOURS = 24;

/** The widest window a coach may demand. Past a week, "book me" stops meaning anything. */
export const MAX_CANCELLATION_HOURS = 168;

/**
 * How long after delivery a student can still say it did not happen.
 *
 * Short enough that a coach is not waiting weeks on their own money, long
 * enough that a session delivered on a Friday night can still be challenged by
 * someone who works Monday to Friday.
 */
export const DISPUTE_WINDOW_HOURS = 72;

/** How long a written review stays hidden while waiting for the other side's. */
export const REVIEW_BLIND_DAYS = 14;

/**
 * Below this many revealed reviews a coach shows a "New" badge instead of a score.
 *
 * Re-exported from `rating.ts`, which is where the aggregation that depends on
 * it lives — two copies of this number would drift and the storefront would
 * start disagreeing with itself about who has a rating.
 */
export { MIN_REVIEWS_FOR_SCORE } from "@/domains/marketplace/rating";

/**
 * The shortest bio a reviewer will be asked to read.
 *
 * Lives here rather than beside the submit check that enforces it, because the
 * form has to show the same number and the form is a client component — and the
 * module holding the submit check reaches for Prisma.
 */
export const MIN_BIO_LENGTH = 120;

/** Bounds on what a coach may charge for one session, in cents. */
export const MIN_PRICE_CENTS = 500;
export const MAX_PRICE_CENTS = 100_000;

/** Bounds on how long one session may be. */
export const MIN_DURATION_MINUTES = 15;
export const MAX_DURATION_MINUTES = 240;

/** Session kinds that occupy a calendar slot, as opposed to running against a deadline. */
const SCHEDULED_KINDS: readonly SessionKind[] = ["LIVE_SESSION", "LIVE_SPECTATE"];

/** Whether this kind of session is booked into a slot rather than promised by a deadline. */
export function isScheduled(kind: SessionKind): boolean {
  return SCHEDULED_KINDS.includes(kind);
}

export interface PriceSplit {
  platformFeeCents: number;
  coachEarningsCents: number;
}

/**
 * Split a price into the platform's cut and the coach's.
 *
 * The platform's share is rounded and the coach takes the remainder, so the two
 * always add back to exactly what the student paid. Rounding the coach's share
 * instead would let a cent go missing on odd prices, and a ledger that does not
 * balance to the cent is one nobody can reconcile a dispute against.
 */
export function splitPrice(priceCents: number, commissionBps: number): PriceSplit {
  const platformFeeCents = Math.round((priceCents * commissionBps) / 10_000);
  return { platformFeeCents, coachEarningsCents: priceCents - platformFeeCents };
}

/** The deadline by which a coach must answer a request made at `from`. */
export function respondByFrom(from: Date): Date {
  return new Date(from.getTime() + COACH_RESPONSE_HOURS * 3_600_000);
}

/** The moment a delivery stops being challengeable and the coach's money is releasable. */
export function autoCompleteFrom(deliveredAt: Date): Date {
  return new Date(deliveredAt.getTime() + DISPUTE_WINDOW_HOURS * 3_600_000);
}

/** The moment two written reviews are revealed even if only one side ever wrote. */
export function reviewRevealDeadlineFrom(completedAt: Date): Date {
  return new Date(completedAt.getTime() + REVIEW_BLIND_DAYS * 86_400_000);
}

/**
 * Whether a student may still cancel without forfeiting.
 *
 * An unscheduled session has no start time to count back from, so the window is
 * measured against delivery instead: it can be cancelled freely right up until
 * the coach has done the work.
 */
export function canCancelFreely(
  startTime: Date | null,
  cancellationHours: number,
  now: Date
): boolean {
  if (!startTime) return true;
  return startTime.getTime() - now.getTime() >= cancellationHours * 3_600_000;
}
