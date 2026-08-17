import { prisma } from "@/lib/db/prisma";
import {
  acceptBooking,
  cancelBooking,
  confirmDelivery,
  declineBooking,
  markDelivered,
  actorOn,
} from "@/domains/marketplace/services/bookingLifecycleService";
import type { LifecycleOutcome } from "@/domains/marketplace/services/bookingLifecycleService";

// What one side can ask of a booking, and the routing of it.
//
// Split from `bookingLifecycleService`, which holds the rules of each move.
// This is the layer a route handler talks to, so that adding a command is one
// case in one switch rather than a new branch in every caller.

/**
 * Set or change where a confirmed session will happen.
 *
 * Separate from accepting, because the coach usually knows they will take the
 * session before they know which room it will be in — and a link that cannot be
 * changed afterwards is one that goes stale between accepting and the day.
 *
 * Not a status change, so it does not go through `transition`: nothing about
 * where a session happens moves it through its life.
 */
export async function setMeetingUrl(
  bookingId: string,
  userId: string,
  meetingUrl: string | null
): Promise<LifecycleOutcome> {
  const actor = await actorOn(bookingId, userId);
  if (!actor) return { ok: false, reason: "not-found" };
  if (actor.role !== "coach") return { ok: false, reason: "forbidden" };

  // Only while the session is still ahead. Rewriting the room a finished
  // session happened in would quietly change the record of it.
  if (actor.status !== "PENDING_COACH" && actor.status !== "CONFIRMED") {
    return { ok: false, reason: "illegal" };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { meetingUrl },
  });

  return { ok: true };
}

/** Everything one side can ask of a booking, as data. */
export type BookingCommand =
  | { action: "accept"; meetingUrl?: string | null }
  | { action: "decline"; reason: string }
  | { action: "cancel"; reason: string }
  | { action: "deliver" }
  | { action: "confirm" }
  | { action: "meeting"; meetingUrl: string | null };

/**
 * Route one command to the function that knows its rules.
 *
 * Here rather than in the route handler because which function a command means
 * is domain knowledge, and a handler that switches on it is one more place to
 * forget a case when a command is added.
 */
export function performBookingCommand(
  bookingId: string,
  userId: string,
  command: BookingCommand
): Promise<LifecycleOutcome> {
  switch (command.action) {
    case "accept":
      return acceptBooking(bookingId, userId, command.meetingUrl ?? null);
    case "decline":
      return declineBooking(bookingId, userId, command.reason);
    case "cancel":
      return cancelBooking(bookingId, userId, command.reason);
    case "deliver":
      return markDelivered(bookingId, userId);
    case "meeting":
      return setMeetingUrl(bookingId, userId, command.meetingUrl);
    case "confirm":
      return confirmDelivery(bookingId, userId);
  }
}
