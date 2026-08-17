import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { autoCompleteFrom, canCancelFreely } from "@/domains/marketplace/policy";
import { transition } from "@/domains/marketplace/services/bookingEventService";
import { settleForStatus } from "@/domains/marketplace/services/payments/paymentService";

// Moving a booking through its life. Creating one is `bookingService`.
//
// Every function here is "who is asking, and are they allowed": the actor is
// established from the row rather than trusted from the request, and the move
// itself goes through `transition`, which refuses anything the state machine
// does not allow and records what it did.

export type ActorRole = "student" | "coach" | "system";

export type LifecycleOutcome =
  | { ok: true }
  | { ok: false; reason: "not-found" | "forbidden" | "illegal" | "stale" | "too-late" };

interface BookingActor {
  bookingId: string;
  status: BookingStatus;
  startTime: Date | null;
  cancellationHours: number;
  role: ActorRole;
}

/**
 * Who this user is on this booking.
 *
 * Null when they are neither side of it — which is the same answer as "no such
 * booking", deliberately: a stranger probing ids should not be able to tell a
 * booking that exists from one that does not.
 */
async function actorOn(bookingId: string, userId: string): Promise<BookingActor | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      startTime: true,
      cancellationHours: true,
      studentId: true,
      coachProfile: { select: { userId: true } },
    },
  });

  if (!booking) return null;

  const role: ActorRole | null =
    booking.studentId === userId
      ? "student"
      : booking.coachProfile.userId === userId
        ? "coach"
        : null;

  if (!role) return null;

  return {
    bookingId: booking.id,
    status: booking.status,
    startTime: booking.startTime,
    cancellationHours: booking.cancellationHours,
    role,
  };
}

/** The coach takes the session. */
export async function acceptBooking(
  bookingId: string,
  userId: string,
  meetingUrl?: string | null
): Promise<LifecycleOutcome> {
  const actor = await actorOn(bookingId, userId);
  if (!actor) return { ok: false, reason: "not-found" };
  if (actor.role !== "coach") return { ok: false, reason: "forbidden" };

  return apply(
    actor,
    "CONFIRMED",
    userId,
    "Accepted by the coach.",
    meetingUrl ? { meetingUrl } : undefined
  );
}

/** The coach turns it down. The reason reaches the student. */
export async function declineBooking(
  bookingId: string,
  userId: string,
  reason: string
): Promise<LifecycleOutcome> {
  const actor = await actorOn(bookingId, userId);
  if (!actor) return { ok: false, reason: "not-found" };
  if (actor.role !== "coach") return { ok: false, reason: "forbidden" };

  return apply(actor, "DECLINED", userId, reason, { cancelledAt: new Date(), cancelReason: reason });
}

/**
 * Either side calls it off.
 *
 * A student inside the cancellation window is refused rather than silently
 * charged: the terms were snapshotted onto the booking when they agreed to
 * them, and this is where they are held to. A coach may always cancel — the
 * session cannot happen without them, and pretending otherwise just produces a
 * no-show — but it is recorded as their cancellation, which is what an
 * automatic refund keys off.
 */
export async function cancelBooking(
  bookingId: string,
  userId: string,
  reason: string,
  now = new Date()
): Promise<LifecycleOutcome> {
  const actor = await actorOn(bookingId, userId);
  if (!actor) return { ok: false, reason: "not-found" };

  if (actor.role === "student") {
    if (
      actor.status === "CONFIRMED" &&
      !canCancelFreely(actor.startTime, actor.cancellationHours, now)
    ) {
      return { ok: false, reason: "too-late" };
    }
    return apply(actor, "CANCELLED_BY_STUDENT", userId, reason, {
      cancelledAt: now,
      cancelReason: reason,
    });
  }

  if (actor.role === "coach") {
    return apply(actor, "CANCELLED_BY_COACH", userId, reason, {
      cancelledAt: now,
      cancelReason: reason,
    });
  }

  return { ok: false, reason: "forbidden" };
}

/**
 * The coach says the work is done.
 *
 * This starts the clock the student can challenge it on, rather than settling
 * anything — `autoCompleteAt` is when it stops being challengeable.
 */
export async function markDelivered(
  bookingId: string,
  userId: string,
  now = new Date()
): Promise<LifecycleOutcome> {
  const actor = await actorOn(bookingId, userId);
  if (!actor) return { ok: false, reason: "not-found" };
  if (actor.role !== "coach") return { ok: false, reason: "forbidden" };

  return apply(actor, "DELIVERED", userId, "Delivered by the coach.", {
    deliveredAt: now,
    autoCompleteAt: autoCompleteFrom(now),
  });
}

/** The student confirms early, without waiting out the challenge window. */
export async function confirmDelivery(
  bookingId: string,
  userId: string,
  now = new Date()
): Promise<LifecycleOutcome> {
  const actor = await actorOn(bookingId, userId);
  if (!actor) return { ok: false, reason: "not-found" };
  if (actor.role !== "student") return { ok: false, reason: "forbidden" };

  return apply(actor, "COMPLETED", userId, "Confirmed by the student.", { completedAt: now });
}

/** A sweep completing a delivery nobody challenged. No actor: nobody did it. */
export async function autoComplete(
  bookingId: string,
  status: BookingStatus,
  now = new Date()
): Promise<LifecycleOutcome> {
  const result = await transition({
    bookingId,
    from: status,
    to: "COMPLETED",
    actorId: null,
    reason: "The challenge window closed with no dispute.",
    data: { completedAt: now },
  });

  if (result.ok) await settleForStatus(bookingId, "COMPLETED");
  return toOutcome(result);
}

/** A sweep giving up on a request the coach never answered. */
export async function expireBooking(bookingId: string, now = new Date()): Promise<LifecycleOutcome> {
  const result = await transition({
    bookingId,
    from: "PENDING_COACH",
    to: "EXPIRED",
    actorId: null,
    reason: "The coach did not answer in time.",
    data: { cancelledAt: now, cancelReason: "No answer from the coach." },
  });

  if (result.ok) await settleForStatus(bookingId, "EXPIRED");
  return toOutcome(result);
}

async function apply(
  actor: BookingActor,
  to: BookingStatus,
  actorId: string,
  reason: string,
  data?: Parameters<typeof transition>[0]["data"]
): Promise<LifecycleOutcome> {
  const result = await transition({
    bookingId: actor.bookingId,
    from: actor.status,
    to,
    actorId,
    reason,
    data,
  });

  if (result.ok) {
    // Driven by where the booking ended up rather than decided here, so the
    // money and the booking can never disagree about what happened.
    await settleForStatus(actor.bookingId, to);
    logger.info("[marketplace] booking moved", {
      bookingId: actor.bookingId,
      from: actor.status,
      to,
    });
  }

  return toOutcome(result);
}

function toOutcome(result: Awaited<ReturnType<typeof transition>>): LifecycleOutcome {
  if (result.ok) return { ok: true };
  return { ok: false, reason: result.reason === "illegal-transition" ? "illegal" : "stale" };
}
