import type { BookingStatus } from "@prisma/client";
import { transition } from "@/domains/marketplace/services/bookingEventService";
import { settleForStatus } from "@/domains/marketplace/services/payments/paymentService";
import { notifyForMove } from "@/domains/marketplace/services/bookingNotifier";
import type { LifecycleOutcome } from "@/domains/marketplace/services/bookingLifecycleService";

// Transitions nobody performs.
//
// Split from `bookingLifecycleService` because these have no actor and no
// permission question: they are what happens when a promise runs out of time.
// The sweeps that call them on a schedule are M16.

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
export async function expireBooking(
  bookingId: string,
  now = new Date()
): Promise<LifecycleOutcome> {
  const result = await transition({
    bookingId,
    from: "PENDING_COACH",
    to: "EXPIRED",
    actorId: null,
    reason: "The coach did not answer in time.",
    data: { cancelledAt: now, cancelReason: "No answer from the coach." },
  });

  if (result.ok) {
    await settleForStatus(bookingId, "EXPIRED");
    await notifyForMove(bookingId, "EXPIRED", null);
  }
  return toOutcome(result);
}

function toOutcome(result: Awaited<ReturnType<typeof transition>>): LifecycleOutcome {
  if (result.ok) return { ok: true };
  return { ok: false, reason: result.reason === "illegal-transition" ? "illegal" : "stale" };
}
