import type { DisputeStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit/auditService";
import { logger } from "@/lib/utils/logger";
import { transition } from "@/domains/marketplace/services/bookingEventService";
import { settleForStatus } from "@/domains/marketplace/services/payments/paymentService";

// The promise of last resort.
//
// The most damaging thing in every competitor's reviews is the same story: a
// session was paid for, it did not happen as sold, and the refusal came back
// with no reasoning anybody outside the company could reconstruct. So a dispute
// here is settled against `booking_events` — a record both sides have been able
// to read the whole time — and the resolution itself is recorded with the admin
// who made it.

export type DisputeOutcome =
  | { ok: true }
  | { ok: false; reason: "not-found" | "forbidden" | "too-late" | "already-open" | "illegal" };

/**
 * The student says it did not happen as sold.
 *
 * Only from `DELIVERED`, and only inside the challenge window. Outside it the
 * booking has already completed and the coach has been paid; reopening that
 * silently is how a marketplace ends up clawing money back from people who did
 * the work.
 */
export async function openDispute(
  bookingId: string,
  userId: string,
  reason: string,
  now = new Date()
): Promise<DisputeOutcome> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      studentId: true,
      autoCompleteAt: true,
      dispute: { select: { id: true } },
    },
  });

  if (!booking) return { ok: false, reason: "not-found" };
  if (booking.studentId !== userId) return { ok: false, reason: "forbidden" };
  if (booking.dispute) return { ok: false, reason: "already-open" };
  if (booking.status !== "DELIVERED") return { ok: false, reason: "illegal" };
  if (booking.autoCompleteAt && booking.autoCompleteAt.getTime() <= now.getTime()) {
    return { ok: false, reason: "too-late" };
  }

  const moved = await transition({
    bookingId,
    from: "DELIVERED",
    to: "DISPUTED",
    actorId: userId,
    reason,
  });
  if (!moved.ok) return { ok: false, reason: "illegal" };

  await prisma.bookingDispute.create({
    data: { bookingId, openedById: userId, reason: reason.trim() },
  });

  logger.info("[marketplace] dispute opened", { bookingId });
  return { ok: true };
}

export interface DisputeRow {
  id: string;
  bookingId: string;
  reason: string;
  status: DisputeStatus;
  openedAt: string;
  studentName: string;
  coachDisplayName: string;
  amountCents: number;
  currency: string;
  listingTitle: string;
  /** The whole recorded history, which is what the decision is made against. */
  history: {
    fromStatus: string | null;
    toStatus: string;
    reason: string | null;
    createdAt: string;
    actorName: string | null;
  }[];
}

/** Open disputes, oldest first. Somebody is waiting on every one of these. */
export async function listDisputes(status: DisputeStatus = "OPEN"): Promise<DisputeRow[]> {
  const rows = await prisma.bookingDispute.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      bookingId: true,
      reason: true,
      status: true,
      createdAt: true,
      booking: {
        select: {
          priceCents: true,
          currency: true,
          listing: { select: { title: true } },
          student: { select: { name: true } },
          coachProfile: { select: { displayName: true } },
          events: {
            orderBy: { createdAt: "asc" },
            select: {
              fromStatus: true,
              toStatus: true,
              reason: true,
              createdAt: true,
              actor: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    bookingId: row.bookingId,
    reason: row.reason,
    status: row.status,
    openedAt: row.createdAt.toISOString(),
    studentName: row.booking.student.name ?? "A student",
    coachDisplayName: row.booking.coachProfile.displayName,
    amountCents: row.booking.priceCents,
    currency: row.booking.currency,
    listingTitle: row.booking.listing.title,
    history: row.booking.events.map((event) => ({
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      reason: event.reason,
      createdAt: event.createdAt.toISOString(),
      actorName: event.actor?.name ?? null,
    })),
  }));
}

/**
 * Settle a dispute one way or the other.
 *
 * The note is required by every caller, and it is what the loser is told. A
 * decision nobody can reconstruct is the whole complaint this section exists
 * to avoid making.
 */
export async function resolveDispute(
  disputeId: string,
  adminId: string,
  outcome: "refund" | "release",
  note: string,
  now = new Date()
): Promise<DisputeOutcome> {
  const dispute = await prisma.bookingDispute.findUnique({
    where: { id: disputeId },
    select: { id: true, bookingId: true, status: true, openedById: true },
  });

  if (!dispute) return { ok: false, reason: "not-found" };
  if (dispute.status !== "OPEN") return { ok: false, reason: "illegal" };

  const toStatus = outcome === "refund" ? "REFUNDED" : "COMPLETED";

  const moved = await transition({
    bookingId: dispute.bookingId,
    from: "DISPUTED",
    to: toStatus,
    actorId: adminId,
    reason: note,
    data: outcome === "release" ? { completedAt: now } : undefined,
  });
  if (!moved.ok) return { ok: false, reason: "illegal" };

  await prisma.bookingDispute.update({
    where: { id: disputeId },
    data: {
      status: outcome === "refund" ? "RESOLVED_REFUND" : "RESOLVED_RELEASE",
      resolutionNote: note.trim(),
      resolvedById: adminId,
      resolvedAt: now,
    },
  });

  // The money follows the booking, as everywhere else.
  await settleForStatus(dispute.bookingId, toStatus);

  await audit({
    userId: dispute.openedById,
    actorId: adminId,
    action: "coach.dispute.resolved",
    resourceId: disputeId,
    metadata: { outcome, note },
  });

  logger.info("[marketplace] dispute resolved", { disputeId, outcome });
  return { ok: true };
}
