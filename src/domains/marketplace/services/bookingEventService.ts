import type { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { canTransition } from "@/domains/marketplace/transitions";

// Every status change a booking ever makes, recorded.
//
// This is the table the whole section is built around, so moving a booking goes
// through here and nowhere else. Two things it guarantees:
//
//   1. The move is legal. `transitions.ts` holds the allowed moves as a table;
//      a service cannot invent one by writing `status` directly.
//   2. The move is accounted for. The most common complaint about every
//      competitor is a session paid for and never delivered, followed by a
//      refusal nobody can reconstruct — which is what having no record of the
//      transitions costs.

type Db = Prisma.TransactionClient | typeof prisma;

export interface TransitionInput {
  bookingId: string;
  from: BookingStatus;
  to: BookingStatus;
  /** Null when a scheduled sweep did it rather than a person. */
  actorId?: string | null;
  reason?: string | null;
  /** Extra columns the new status implies, e.g. `deliveredAt`. */
  data?: Prisma.BookingUpdateInput;
}

export type TransitionOutcome =
  | { ok: true }
  | { ok: false; reason: "illegal-transition" | "stale" };

/**
 * Move a booking, and write the event that says so.
 *
 * The update is guarded on the status we read, so two requests racing to accept
 * the same booking cannot both succeed — the second updates nothing and is told
 * the booking moved under it. That guard is why this takes `from` at all.
 */
export async function transition(
  input: TransitionInput,
  db: Db = prisma
): Promise<TransitionOutcome> {
  if (!canTransition(input.from, input.to)) return { ok: false, reason: "illegal-transition" };

  const { count } = await db.booking.updateMany({
    where: { id: input.bookingId, status: input.from },
    data: { status: input.to, ...(input.data as Prisma.BookingUpdateManyMutationInput) },
  });

  if (count === 0) return { ok: false, reason: "stale" };

  await db.bookingEvent.create({
    data: {
      bookingId: input.bookingId,
      actorId: input.actorId ?? null,
      fromStatus: input.from,
      toStatus: input.to,
      reason: input.reason ?? null,
    },
  });

  return { ok: true };
}

/** The event that records a booking coming into existence. */
export async function recordCreation(
  bookingId: string,
  actorId: string,
  db: Db = prisma
): Promise<void> {
  await db.bookingEvent.create({
    data: {
      bookingId,
      actorId,
      // Null `from`: nothing preceded it. A first row with a fabricated
      // previous status would read as a transition that never happened.
      fromStatus: null,
      toStatus: "PENDING_COACH",
      reason: "Requested by the student.",
    },
  });
}

/** A booking's whole history, oldest first. What a dispute is settled against. */
export async function bookingHistory(bookingId: string) {
  return prisma.bookingEvent.findMany({
    where: { bookingId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      reason: true,
      createdAt: true,
      actor: { select: { id: true, name: true } },
    },
  });
}
