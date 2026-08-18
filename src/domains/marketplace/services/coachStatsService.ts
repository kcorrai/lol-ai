import { prisma } from "@/lib/db/prisma";

// The readouts the coach console draws its money panel and health rail from.
//
// Separate from `coachWorkload`, which counts what is open right now. These
// look backwards instead, and every one of them is derived from rows we already
// write — nothing here is a figure a coach could type in about themselves.

const WEEKS = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Money that settled in one calendar week, oldest bucket first. */
export interface EarningsWeek {
  /** ISO date of the Monday the week opens on, UTC. */
  weekStart: string;
  earnedCents: number;
  /** Sessions delivered in the week — the volume behind the money. */
  sessions: number;
}

export interface CoachConsoleStats {
  /** Always `WEEKS` long, zero-filled — a gap week is information, not a hole. */
  weeks: EarningsWeek[];
  /** What the platform took from work that reached delivery, lifetime. */
  platformFeeCents: number;
  currency: string;
  /**
   * Accepted over everything that got a verdict, expiries included: a coach who
   * lets requests time out has not kept a perfect record, they have ignored one.
   * Null until a first request has been answered one way or the other.
   */
  acceptRate: number | null;
  /** How many requests have been resolved at all — the sample behind the rate. */
  decidedCount: number;
  /** Typical hours between a request arriving and being answered. */
  medianAnswerHours: number | null;
  openDisputes: number;
}

/** The Monday 00:00 UTC on or before `date`. */
function weekStartOf(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // getUTCDay is 0 on Sunday, which is the end of the week we want, not the start.
  const shift = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - shift);
  return d;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Everything the console shows about how a coach is doing.
 *
 * One call rather than five, because the page renders them as a single picture
 * and a half-loaded picture reads as a broken one.
 */
export async function coachConsoleStats(
  coachProfileId: string,
  now: Date = new Date()
): Promise<CoachConsoleStats> {
  const thisWeek = weekStartOf(now);
  const from = new Date(thisWeek.getTime() - (WEEKS - 1) * WEEK_MS);

  const [settled, feeAgg, verdicts, answers, openDisputes] = await Promise.all([
    // Delivered work, whether or not its challenge window has closed: a coach
    // has earned the session by running it, not by the sweep noticing later.
    prisma.booking.findMany({
      where: {
        coachProfileId,
        status: { in: ["DELIVERED", "COMPLETED"] },
        deliveredAt: { gte: from },
      },
      select: { deliveredAt: true, coachEarningsCents: true, currency: true },
      take: 500,
    }),
    prisma.booking.aggregate({
      where: { coachProfileId, status: { in: ["DELIVERED", "COMPLETED"] } },
      _sum: { platformFeeCents: true },
    }),
    prisma.bookingEvent.groupBy({
      by: ["toStatus"],
      where: {
        booking: { coachProfileId },
        fromStatus: "PENDING_COACH",
        toStatus: { in: ["CONFIRMED", "DECLINED", "EXPIRED"] },
      },
      _count: { _all: true },
    }),
    prisma.bookingEvent.findMany({
      where: {
        booking: { coachProfileId },
        fromStatus: "PENDING_COACH",
        toStatus: { in: ["CONFIRMED", "DECLINED"] },
      },
      select: { createdAt: true, booking: { select: { createdAt: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.bookingDispute.count({
      where: { booking: { coachProfileId }, status: "OPEN" },
    }),
  ]);

  const buckets = new Map<string, EarningsWeek>();
  for (let i = 0; i < WEEKS; i += 1) {
    const weekStart = new Date(from.getTime() + i * WEEK_MS).toISOString();
    buckets.set(weekStart, { weekStart, earnedCents: 0, sessions: 0 });
  }
  for (const row of settled) {
    if (!row.deliveredAt) continue;
    const bucket = buckets.get(weekStartOf(row.deliveredAt).toISOString());
    if (!bucket) continue;
    bucket.earnedCents += row.coachEarningsCents;
    bucket.sessions += 1;
  }

  const counted = (status: string): number =>
    verdicts.find((v) => v.toStatus === status)?._count._all ?? 0;
  const accepted = counted("CONFIRMED");
  const decided = accepted + counted("DECLINED") + counted("EXPIRED");

  const answerHours = answers.map(
    (a) => (a.createdAt.getTime() - a.booking.createdAt.getTime()) / 3_600_000
  );

  return {
    weeks: [...buckets.values()],
    platformFeeCents: feeAgg._sum.platformFeeCents ?? 0,
    currency: settled[0]?.currency ?? "USD",
    acceptRate: decided === 0 ? null : accepted / decided,
    decidedCount: decided,
    medianAnswerHours: median(answerHours),
    openDisputes,
  };
}

/** How one listing is actually selling. Every figure is counted, never estimated. */
export interface ListingPerformance {
  listingId: string;
  /** Requests this listing has had, lifetime. */
  requests: number;
  /** Share of decided requests the coach accepted, 0–1. Null before the first. */
  acceptRate: number | null;
  /** Sessions that reached delivery. */
  delivered: number;
  /** Mean revealed rating on this listing. Null until one is revealed. */
  rating: number | null;
}

/**
 * Per-listing numbers for the coach's own listings page.
 *
 * Deliberately not "profile views": nothing in this product counts a view, and
 * a listing card is exactly the place where an invented metric would start
 * being used to set prices.
 */
export async function listingPerformance(
  coachProfileId: string
): Promise<Map<string, ListingPerformance>> {
  const [byListing, byStatus, reviews] = await Promise.all([
    prisma.booking.groupBy({
      by: ["listingId"],
      where: { coachProfileId },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["listingId", "status"],
      where: { coachProfileId },
      _count: { _all: true },
    }),
    prisma.sessionReview.findMany({
      where: {
        coachProfileId,
        authorRole: "STUDENT",
        revealedAt: { not: null },
      },
      select: { rating: true, booking: { select: { listingId: true } } },
      take: 500,
    }),
  ]);

  // Anything past PENDING_COACH other than a verdict against it was accepted.
  const REFUSED: string[] = ["DECLINED", "EXPIRED"];
  const ratings = new Map<string, number[]>();
  for (const review of reviews) {
    const list = ratings.get(review.booking.listingId) ?? [];
    list.push(review.rating);
    ratings.set(review.booking.listingId, list);
  }

  const countOf = (listingId: string, predicate: (status: string) => boolean): number =>
    byStatus
      .filter((row) => row.listingId === listingId && predicate(row.status))
      .reduce((sum, row) => sum + row._count._all, 0);

  return new Map(
    byListing.map((row) => {
      const refused = countOf(row.listingId, (s) => REFUSED.includes(s));
      const pending = countOf(row.listingId, (s) => s === "PENDING_COACH");
      const decided = row._count._all - pending;
      const scores = ratings.get(row.listingId) ?? [];

      return [
        row.listingId,
        {
          listingId: row.listingId,
          requests: row._count._all,
          acceptRate: decided === 0 ? null : (decided - refused) / decided,
          delivered: countOf(row.listingId, (s) => s === "DELIVERED" || s === "COMPLETED"),
          rating:
            scores.length === 0
              ? null
              : scores.reduce((sum, n) => sum + n, 0) / scores.length,
        },
      ];
    })
  );
}
