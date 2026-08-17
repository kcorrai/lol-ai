import type { ReviewAuthorRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { reviewRevealDeadlineFrom } from "@/domains/marketplace/policy";
import { aggregateRatings } from "@/domains/marketplace/rating";
import type { PublicReview } from "@/domains/marketplace/types";

// Two-sided, blind until both are in.
//
// Neither side sees the other's review until both have written one or the
// window closes, whichever comes first. Airbnb published what changing to this
// did: more reviews, and more honest negative ones, because a student writing
// the truth is no longer risking the reply. Every competitor in this category
// is one-sided, which is why their coach ratings all sit at 4.9.
//
// A review can only exist for a booking that completed. That makes every one of
// them a verified purchase by construction rather than by a check somebody
// could forget.

export type ReviewOutcome =
  | { ok: true; revealed: boolean }
  | {
      ok: false;
      reason: "not-found" | "forbidden" | "not-complete" | "already-reviewed" | "invalid";
    };

/** Write one side's review. */
export async function leaveReview(
  bookingId: string,
  userId: string,
  rating: number,
  body: string | null,
  now = new Date()
): Promise<ReviewOutcome> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, reason: "invalid" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      studentId: true,
      completedAt: true,
      coachProfileId: true,
      coachProfile: { select: { userId: true } },
    },
  });

  if (!booking) return { ok: false, reason: "not-found" };

  const authorRole: ReviewAuthorRole | null =
    booking.studentId === userId
      ? "STUDENT"
      : booking.coachProfile.userId === userId
        ? "COACH"
        : null;

  if (!authorRole) return { ok: false, reason: "not-found" };
  // Verified purchase by construction: no completed session, no review.
  if (booking.status !== "COMPLETED") return { ok: false, reason: "not-complete" };

  const existing = await prisma.sessionReview.findUnique({
    where: { bookingId_authorRole: { bookingId, authorRole } },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: "already-reviewed" };

  await prisma.sessionReview.create({
    data: {
      bookingId,
      coachProfileId: booking.coachProfileId,
      studentId: booking.studentId,
      authorRole,
      rating,
      body: body?.trim() || null,
    },
  });

  const revealed = await revealIfReady(bookingId, now);
  if (revealed) await refreshCoachRating(booking.coachProfileId);

  return { ok: true, revealed };
}

/**
 * Reveal both reviews once both sides have written.
 *
 * Both rows get the same `revealedAt`, so there is no window in which one is
 * visible and the other is not — which is the whole point.
 */
export async function revealIfReady(bookingId: string, now = new Date()): Promise<boolean> {
  const reviews = await prisma.sessionReview.findMany({
    where: { bookingId },
    select: { id: true, revealedAt: true },
  });

  if (reviews.length < 2) return false;
  if (reviews.every((review) => review.revealedAt !== null)) return true;

  await prisma.sessionReview.updateMany({
    where: { bookingId, revealedAt: null },
    data: { revealedAt: now },
  });

  logger.info("[marketplace] reviews revealed", { bookingId });
  return true;
}

/**
 * Reveal reviews whose window has closed with only one side written.
 *
 * Without this a one-sided review would stay hidden for ever, which would
 * quietly punish the person who did write one.
 */
export async function revealExpired(now = new Date(), limit = 200): Promise<number> {
  const due = await prisma.sessionReview.findMany({
    where: {
      revealedAt: null,
      booking: { completedAt: { not: null, lte: cutoff(now) } },
    },
    take: limit,
    select: { id: true, bookingId: true, coachProfileId: true },
  });

  if (due.length === 0) return 0;

  await prisma.sessionReview.updateMany({
    where: { id: { in: due.map((review) => review.id) } },
    data: { revealedAt: now },
  });

  for (const coachProfileId of new Set(due.map((review) => review.coachProfileId))) {
    await refreshCoachRating(coachProfileId);
  }

  logger.info("[marketplace] revealed reviews past their window", { count: due.length });
  return due.length;
}

/** The completion time at which an unrevealed review's window has run out. */
function cutoff(now: Date): Date {
  // `reviewRevealDeadlineFrom` walks forward from completion; this walks back
  // from now to the completion time that lands exactly on the deadline.
  const forward = reviewRevealDeadlineFrom(new Date(0)).getTime();
  return new Date(now.getTime() - forward);
}

/**
 * Recompute a coach's two aggregates from their revealed reviews.
 *
 * Only student reviews count toward a coach's rating — a coach rating their own
 * students has nothing to do with how good the coaching was.
 */
export async function refreshCoachRating(coachProfileId: string): Promise<void> {
  const reviews = await prisma.sessionReview.findMany({
    where: { coachProfileId, authorRole: "STUDENT", revealedAt: { not: null } },
    select: { rating: true },
  });

  const aggregate = aggregateRatings(reviews.map((review) => review.rating));

  await prisma.coachProfile.update({
    where: { id: coachProfileId },
    data: {
      ratingBayes: aggregate.display ?? 0,
      ratingWilson: aggregate.sort,
      ratingCount: aggregate.count,
    },
  });
}

/** The revealed student reviews on a coach's public profile. */
export async function publicReviews(
  coachProfileId: string,
  limit = 20
): Promise<PublicReview[]> {
  const rows = await prisma.sessionReview.findMany({
    where: { coachProfileId, authorRole: "STUDENT", revealedAt: { not: null } },
    orderBy: { revealedAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      body: true,
      createdAt: true,
      coachReply: true,
      coachRepliedAt: true,
      student: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    body: row.body,
    authorName: row.student.name ?? "A student",
    createdAt: row.createdAt.toISOString(),
    coachReply: row.coachReply,
    coachRepliedAt: row.coachRepliedAt?.toISOString() ?? null,
  }));
}

/** The coach's public answer to a review. Carries no rating and moves no aggregate. */
export async function replyToReview(
  reviewId: string,
  userId: string,
  reply: string
): Promise<ReviewOutcome> {
  const { count } = await prisma.sessionReview.updateMany({
    where: {
      id: reviewId,
      authorRole: "STUDENT",
      revealedAt: { not: null },
      coachProfile: { userId },
    },
    data: { coachReply: reply.trim(), coachRepliedAt: new Date() },
  });

  return count > 0 ? { ok: true, revealed: true } : { ok: false, reason: "not-found" };
}
