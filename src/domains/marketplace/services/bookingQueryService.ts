import { prisma } from "@/lib/db/prisma";
import { paymentFor } from "@/domains/marketplace/services/payments/paymentService";
import type { BookingSummary } from "@/domains/marketplace/types";

// Reading bookings, for the two lists that exist: a student's sessions and a
// coach's requests. Both are scoped by who is asking, in the query.

const SUMMARY_SELECT = {
  id: true,
  kind: true,
  status: true,
  startTime: true,
  endTime: true,
  priceCents: true,
  currency: true,
  respondByAt: true,
  createdAt: true,
  studentGoal: true,
  meetingUrl: true,
  matchIds: true,
  vodUrl: true,
  deliveredAt: true,
  autoCompleteAt: true,
  listing: { select: { title: true, durationMinutes: true } },
  coachProfile: { select: { slug: true, displayName: true } },
  student: { select: { name: true, email: true } },
} as const;

type Row = {
  startTime: Date | null;
  endTime: Date | null;
  respondByAt: Date;
  createdAt: Date;
  listing: { title: string; durationMinutes: number };
  coachProfile: { slug: string | null; displayName: string };
  student: { name: string | null; email: string | null };
} & Omit<
  BookingSummary,
  | "startTime"
  | "endTime"
  | "respondByAt"
  | "createdAt"
  | "durationMinutes"
  | "coachSlug"
  | "coachDisplayName"
  | "studentName"
  | "listingTitle"
>;

function toSummary(row: Row): BookingSummary {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    startTime: row.startTime?.toISOString() ?? null,
    endTime: row.endTime?.toISOString() ?? null,
    durationMinutes: row.listing.durationMinutes,
    priceCents: row.priceCents,
    currency: row.currency,
    coachSlug: row.coachProfile.slug ?? "",
    coachDisplayName: row.coachProfile.displayName,
    // The name, never the email: a coach needs to know who they are talking to,
    // not how to reach them off the platform.
    studentName: row.student.name ?? "A student",
    listingTitle: row.listing.title,
    respondByAt: row.respondByAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * The caller's bookings on one side.
 *
 * Ordered by when they happen for a scheduled session and by when they were
 * asked for otherwise, which is the order each side actually works through
 * them: a coach clears requests oldest first, a student looks at what is next.
 */
export async function listBookings(
  userId: string,
  as: "student" | "coach"
): Promise<BookingSummary[]> {
  const where = as === "student" ? { studentId: userId } : { coachProfile: { userId } };

  const rows = await prisma.booking.findMany({
    where,
    orderBy: [{ startTime: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: SUMMARY_SELECT,
  });

  return rows.map(toSummary);
}

/** One booking, but only for somebody who is on it. */
export async function getBookingFor(bookingId: string, userId: string) {
  const row = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [{ studentId: userId }, { coachProfile: { userId } }],
    },
    select: {
      ...SUMMARY_SELECT,
      studentId: true,
      coachProfile: { select: { slug: true, displayName: true, userId: true } },
    },
  });

  if (!row) return null;

  return {
    ...toSummary(row as unknown as Row),
    payment: await paymentFor(bookingId),
    role: row.studentId === userId ? ("student" as const) : ("coach" as const),
    studentGoal: row.studentGoal,
    meetingUrl: row.meetingUrl,
    matchIds: row.matchIds,
    vodUrl: row.vodUrl,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    autoCompleteAt: row.autoCompleteAt?.toISOString() ?? null,
  };
}

export interface CoachWorkload {
  /** Requests waiting on an answer. The number that should nag. */
  pending: number;
  /** Confirmed sessions still ahead. */
  upcoming: number;
  /** Delivered work still inside its challenge window. */
  awaitingConfirmation: number;
  /** Money the ledger says is the coach's, in the platform's smallest unit. */
  releasedCents: number;
  /** Money still held against live bookings. */
  heldCents: number;
  currency: string;
}

/**
 * The numbers a coach's console opens on.
 *
 * Counted rather than listed: the console needs to say "three people are
 * waiting on you", and loading three bookings to say it would be the same
 * query the sessions page already runs.
 */
export async function coachWorkload(coachProfileId: string): Promise<CoachWorkload> {
  const now = new Date();

  const [pending, upcoming, awaitingConfirmation, released, held] = await Promise.all([
    prisma.booking.count({ where: { coachProfileId, status: "PENDING_COACH" } }),
    prisma.booking.count({
      where: { coachProfileId, status: "CONFIRMED", startTime: { gte: now } },
    }),
    prisma.booking.count({ where: { coachProfileId, status: "DELIVERED" } }),
    prisma.bookingPayment.aggregate({
      where: { booking: { coachProfileId }, status: "RELEASED" },
      _sum: { coachAmountCents: true },
    }),
    prisma.bookingPayment.aggregate({
      where: { booking: { coachProfileId }, status: "HELD" },
      _sum: { coachAmountCents: true },
    }),
  ]);

  return {
    pending,
    upcoming,
    awaitingConfirmation,
    releasedCents: released._sum.coachAmountCents ?? 0,
    heldCents: held._sum.coachAmountCents ?? 0,
    // One currency for now. A coach selling in two would need this per
    // currency, and the aggregate above would be wrong — worth saying out loud
    // before somebody adds a second one.
    currency: "USD",
  };
}
