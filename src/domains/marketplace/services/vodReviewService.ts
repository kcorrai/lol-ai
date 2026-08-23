import type { AnnotationCategory } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Annotation, VodReviewDelivery } from "@/domains/marketplace/types";

// The async deliverable: a written summary plus timestamped notes.
//
// We host no video (ADR-021). The review points at whatever the student gave
// us — a match id of ours or a link of theirs — and the notes are anchored to a
// second on that clock. That is the whole of what a replay review is; every
// platform that also built an uploader ended up paying to store footage it did
// not own, and Metafy's own async product delivers a timestamped document.

export interface AnnotationInput {
  timestampSeconds: number;
  title: string;
  body: string;
  category: AnnotationCategory;
}

export type VodOutcome =
  | { ok: true; review: VodReviewDelivery }
  | { ok: false; reason: "not-found" | "forbidden" | "wrong-kind" | "invalid"; detail?: string };

const REVIEW_SELECT = {
  bookingId: true,
  summary: true,
  sourceUrl: true,
  matchId: true,
  publishedAt: true,
  annotations: {
    orderBy: { timestampSeconds: "asc" as const },
    select: {
      id: true,
      timestampSeconds: true,
      title: true,
      body: true,
      category: true,
    },
  },
} as const;

/**
 * The review on a booking, for whoever is on it.
 *
 * Unpublished drafts are visible to the coach and to nobody else — a student
 * reading half-written notes would be worse than reading none.
 */
export async function getReview(
  bookingId: string,
  userId: string
): Promise<VodReviewDelivery | null> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, OR: [{ studentId: userId }, { coachProfile: { userId } }] },
    select: { studentId: true, vodReview: { select: REVIEW_SELECT } },
  });

  if (!booking?.vodReview) return null;

  const isStudent = booking.studentId === userId;
  if (isStudent && !booking.vodReview.publishedAt) return null;

  return toDelivery(booking.vodReview);
}

/**
 * Create or replace the coach's draft.
 *
 * The annotations are replaced wholesale rather than patched: a coach edits
 * them as a list, and a partial update would leave a note nobody meant to keep.
 * Publishing is a separate act, so saving a draft never shows a student
 * something half-written.
 */
export async function saveReview(
  bookingId: string,
  userId: string,
  input: { summary: string; sourceUrl?: string | null; annotations: AnnotationInput[] }
): Promise<VodOutcome> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      kind: true,
      status: true,
      matchIds: true,
      vodUrl: true,
      coachProfile: { select: { userId: true } },
    },
  });

  if (!booking) return { ok: false, reason: "not-found" };
  if (booking.coachProfile.userId !== userId) return { ok: false, reason: "forbidden" };
  if (booking.kind !== "VOD_REVIEW") return { ok: false, reason: "wrong-kind" };

  const invalid = firstInvalid(input);
  if (invalid) return { ok: false, reason: "invalid", detail: invalid };

  const data = {
    summary: input.summary.trim(),
    // Falls back to what the student supplied, so a coach who writes the review
    // without re-pasting the link does not lose what it was about.
    sourceUrl: input.sourceUrl?.trim() || booking.vodUrl,
    matchId: booking.matchIds[0] ?? null,
  };

  const review = await prisma.$transaction(async (tx) => {
    const saved = await tx.vodReview.upsert({
      where: { bookingId },
      create: { bookingId, ...data },
      update: data,
      select: { id: true },
    });

    await tx.vodAnnotation.deleteMany({ where: { vodReviewId: saved.id } });
    if (input.annotations.length > 0) {
      await tx.vodAnnotation.createMany({
        data: input.annotations.map((annotation) => ({
          vodReviewId: saved.id,
          timestampSeconds: Math.max(0, Math.round(annotation.timestampSeconds)),
          title: annotation.title.trim(),
          body: annotation.body.trim(),
          category: annotation.category,
        })),
      });
    }

    return tx.vodReview.findUniqueOrThrow({ where: { bookingId }, select: REVIEW_SELECT });
  });

  return { ok: true, review: toDelivery(review) };
}

/** Publish the draft. The booking is moved separately, by the lifecycle service. */
export async function publishReview(bookingId: string, userId: string): Promise<VodOutcome> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      coachProfile: { select: { userId: true } },
      vodReview: { select: { summary: true } },
    },
  });

  if (!booking) return { ok: false, reason: "not-found" };
  if (booking.coachProfile.userId !== userId) return { ok: false, reason: "forbidden" };
  if (!booking.vodReview) {
    return { ok: false, reason: "invalid", detail: "Write the review before publishing it." };
  }

  const review = await prisma.vodReview.update({
    where: { bookingId },
    data: { publishedAt: new Date() },
    select: REVIEW_SELECT,
  });

  return { ok: true, review: toDelivery(review) };
}

type ReviewRow = {
  bookingId: string;
  summary: string;
  sourceUrl: string | null;
  matchId: string | null;
  publishedAt: Date | null;
  annotations: (Omit<Annotation, "id"> & { id: string })[];
};

function toDelivery(row: ReviewRow): VodReviewDelivery {
  return {
    bookingId: row.bookingId,
    summary: row.summary,
    sourceUrl: row.sourceUrl,
    matchId: row.matchId,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    annotations: row.annotations,
  };
}

/** The first thing wrong with a draft, phrased for the coach. Null when it is fine. */
function firstInvalid(input: { summary: string; annotations: AnnotationInput[] }): string | null {
  if (input.summary.trim().length < 30) {
    return "Write at least a couple of sentences of summary.";
  }
  if (input.annotations.length > 60) {
    return "Sixty notes is plenty — a review nobody can read is not a review.";
  }
  for (const annotation of input.annotations) {
    if (!annotation.title.trim()) return "Every note needs a title.";
    if (annotation.timestampSeconds < 0) return "A note cannot be before the game started.";
  }
  return null;
}
