import type { BookingStatus } from "@prisma/client";

// The booking state machine, as data.
//
// Kept here as a pure table rather than as `if` statements scattered across the
// services that move bookings, because the one thing this section cannot afford
// is a transition nobody can account for. Every move a service makes is checked
// against this map and written to `booking_events`; a status that changed
// without a matching row is a bug, not a shortcut.

/** What each status is allowed to become. Anything not listed is refused. */
const ALLOWED: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING_COACH: ["CONFIRMED", "DECLINED", "EXPIRED", "CANCELLED_BY_STUDENT"],
  CONFIRMED: ["DELIVERED", "CANCELLED_BY_STUDENT", "CANCELLED_BY_COACH"],
  DELIVERED: ["COMPLETED", "DISPUTED"],
  DISPUTED: ["COMPLETED", "REFUNDED"],
  // Terminal. A settled booking is a record, not a thing to keep editing.
  COMPLETED: [],
  DECLINED: [],
  EXPIRED: [],
  CANCELLED_BY_STUDENT: [],
  CANCELLED_BY_COACH: [],
  REFUNDED: [],
};

/** Statuses nothing can follow. */
export function isTerminal(status: BookingStatus): boolean {
  return ALLOWED[status].length === 0;
}

/** Whether a booking in `from` may move to `to`. */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED[from].includes(to);
}

/** Every status `from` may move to. */
export function nextStatuses(from: BookingStatus): readonly BookingStatus[] {
  return ALLOWED[from];
}

/**
 * Statuses where the student's money is committed but not yet the coach's.
 *
 * This is what a payment hold covers, and what a refund can still unwind
 * without anyone having to claw money back from a coach.
 */
export function holdsFunds(status: BookingStatus): boolean {
  return (
    status === "PENDING_COACH" ||
    status === "CONFIRMED" ||
    status === "DELIVERED" ||
    status === "DISPUTED"
  );
}

/** Statuses that entitle the student to their money back with no judgement call. */
export function refundsAutomatically(status: BookingStatus): boolean {
  return (
    status === "DECLINED" ||
    status === "EXPIRED" ||
    status === "CANCELLED_BY_COACH" ||
    status === "CANCELLED_BY_STUDENT"
  );
}

/** Whether a session got far enough that either side may review it. */
export function isReviewable(status: BookingStatus): boolean {
  return status === "COMPLETED";
}
