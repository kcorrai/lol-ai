import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { autoComplete, expireBooking } from "@/domains/marketplace/services/bookingSweepService";
import { revealExpired } from "@/domains/marketplace/services/reviewService";

// The promises the marketplace keeps without anybody pressing anything.
//
// Three of them, and each closes a failure the competitor research kept turning
// up: a request that sits on a student's money for ever because nobody answered
// it; a delivery that never settles because nobody clicked; a review that stays
// hidden for ever because the other side never wrote one.
//
// Every sweep is bounded per run. One that tries to do everything on a bad day
// does none of it, and what it skips is picked up next time — nothing here is
// time-critical to the minute.

export interface SweepReport {
  expired: number;
  completed: number;
  reviewsRevealed: number;
  failed: number;
}

const BATCH = 200;

/**
 * Give up on requests the coach never answered.
 *
 * `respondByAt` is on the booking rather than computed here, so the deadline a
 * booking is held to is the one it was created under — shortening the window
 * later must not retroactively expire something.
 */
export async function expireUnanswered(now = new Date(), limit = BATCH): Promise<number> {
  const due = await prisma.booking.findMany({
    where: { status: "PENDING_COACH", respondByAt: { lte: now } },
    orderBy: { respondByAt: "asc" },
    take: limit,
    select: { id: true },
  });

  let expired = 0;
  for (const booking of due) {
    const result = await expireBooking(booking.id, now);
    if (result.ok) expired += 1;
  }

  return expired;
}

/**
 * Settle deliveries nobody challenged.
 *
 * This is where the coach's money actually becomes theirs, so it is also where
 * a bug would be most expensive — hence the guarded transition underneath,
 * which refuses to move a booking that has since been disputed.
 */
export async function completeUnchallenged(now = new Date(), limit = BATCH): Promise<number> {
  const due = await prisma.booking.findMany({
    where: { status: "DELIVERED", autoCompleteAt: { not: null, lte: now } },
    orderBy: { autoCompleteAt: "asc" },
    take: limit,
    select: { id: true },
  });

  let completed = 0;
  for (const booking of due) {
    const result = await autoComplete(booking.id, "DELIVERED", now);
    if (result.ok) completed += 1;
  }

  return completed;
}

/** Run all three, and say what each did. */
export async function runBookingSweeps(now = new Date()): Promise<SweepReport> {
  const report: SweepReport = { expired: 0, completed: 0, reviewsRevealed: 0, failed: 0 };

  // Sequential rather than parallel: they touch the same rows in sequence — an
  // expiry can create work for nothing else, but a completion can create a
  // review window, and running them in order keeps the report honest about
  // what happened in this run.
  const steps: [keyof SweepReport, () => Promise<number>][] = [
    ["expired", () => expireUnanswered(now)],
    ["completed", () => completeUnchallenged(now)],
    ["reviewsRevealed", () => revealExpired(now)],
  ];

  for (const [key, step] of steps) {
    try {
      report[key] = await step();
    } catch (error) {
      // One failing sweep must not stop the others. A stuck expiry leaving
      // deliveries unsettled would turn one problem into two.
      report.failed += 1;
      logger.error("[marketplace] a sweep failed", { step: key, error });
    }
  }

  return report;
}
