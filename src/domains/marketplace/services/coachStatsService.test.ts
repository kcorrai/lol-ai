import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  coachConsoleStats,
  listingPerformance,
} from "@/domains/marketplace/services/coachStatsService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    booking: { findMany: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() },
    sessionReview: { findMany: vi.fn() },
    bookingEvent: { groupBy: vi.fn(), findMany: vi.fn() },
    bookingDispute: { count: vi.fn() },
  },
}));

const mockPrisma = vi.mocked(prisma, true);

// A Wednesday, so nothing passes by accident on a week that starts today.
const NOW = new Date("2026-08-19T12:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findMany.mockResolvedValue([] as never);
  mockPrisma.booking.aggregate.mockResolvedValue({ _sum: { platformFeeCents: 0 } } as never);
  mockPrisma.bookingEvent.groupBy.mockResolvedValue([] as never);
  mockPrisma.bookingEvent.findMany.mockResolvedValue([] as never);
  mockPrisma.bookingDispute.count.mockResolvedValue(0 as never);
  mockPrisma.booking.groupBy.mockResolvedValue([] as never);
  mockPrisma.sessionReview.findMany.mockResolvedValue([] as never);
});

describe("coachConsoleStats", () => {
  it("returns eight zero-filled weeks ending on the current one", async () => {
    const stats = await coachConsoleStats("coach-1", NOW);

    expect(stats.weeks).toHaveLength(8);
    expect(stats.weeks.every((w) => w.earnedCents === 0)).toBe(true);
    // 19 Aug 2026 is a Wednesday; its week opens on Monday the 17th.
    expect(stats.weeks[7].weekStart).toBe("2026-08-17T00:00:00.000Z");
    expect(stats.weeks[0].weekStart).toBe("2026-06-29T00:00:00.000Z");
  });

  it("buckets a delivery into the Monday-opening week it landed in", async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      // Sunday, which belongs to the week that opened six days earlier.
      {
        deliveredAt: new Date("2026-08-16T22:00:00.000Z"),
        coachEarningsCents: 4000,
        currency: "USD",
      },
      {
        deliveredAt: new Date("2026-08-18T09:00:00.000Z"),
        coachEarningsCents: 2400,
        currency: "USD",
      },
      {
        deliveredAt: new Date("2026-08-19T09:00:00.000Z"),
        coachEarningsCents: 1600,
        currency: "USD",
      },
    ] as never);

    const stats = await coachConsoleStats("coach-1", NOW);

    expect(stats.weeks[6]).toEqual({
      weekStart: "2026-08-10T00:00:00.000Z",
      earnedCents: 4000,
      sessions: 1,
    });
    expect(stats.weeks[7]).toMatchObject({ earnedCents: 4000, sessions: 2 });
  });

  it("drops a delivery older than the window instead of folding it into week one", async () => {
    mockPrisma.booking.findMany.mockResolvedValue([
      {
        deliveredAt: new Date("2026-01-05T10:00:00.000Z"),
        coachEarningsCents: 9900,
        currency: "USD",
      },
    ] as never);

    const stats = await coachConsoleStats("coach-1", NOW);

    expect(stats.weeks.reduce((sum, w) => sum + w.earnedCents, 0)).toBe(0);
  });

  it("counts an expired request against the accept rate", async () => {
    mockPrisma.bookingEvent.groupBy.mockResolvedValue([
      { toStatus: "CONFIRMED", _count: { _all: 8 } },
      { toStatus: "DECLINED", _count: { _all: 1 } },
      { toStatus: "EXPIRED", _count: { _all: 1 } },
    ] as never);

    const stats = await coachConsoleStats("coach-1", NOW);

    expect(stats.decidedCount).toBe(10);
    expect(stats.acceptRate).toBe(0.8);
  });

  it("has no accept rate at all until a request has been decided", async () => {
    const stats = await coachConsoleStats("coach-1", NOW);

    expect(stats.acceptRate).toBeNull();
    expect(stats.medianAnswerHours).toBeNull();
  });

  it("takes the median answer time, so one holiday does not become the number", async () => {
    const asked = new Date("2026-08-10T00:00:00.000Z");
    mockPrisma.bookingEvent.findMany.mockResolvedValue([
      { createdAt: new Date("2026-08-10T02:00:00.000Z"), booking: { createdAt: asked } },
      { createdAt: new Date("2026-08-10T04:00:00.000Z"), booking: { createdAt: asked } },
      { createdAt: new Date("2026-08-11T20:00:00.000Z"), booking: { createdAt: asked } },
    ] as never);

    const stats = await coachConsoleStats("coach-1", NOW);

    expect(stats.medianAnswerHours).toBe(4);
  });

  it("averages the middle pair when the sample is even", async () => {
    const asked = new Date("2026-08-10T00:00:00.000Z");
    mockPrisma.bookingEvent.findMany.mockResolvedValue([
      { createdAt: new Date("2026-08-10T01:00:00.000Z"), booking: { createdAt: asked } },
      { createdAt: new Date("2026-08-10T03:00:00.000Z"), booking: { createdAt: asked } },
      { createdAt: new Date("2026-08-10T05:00:00.000Z"), booking: { createdAt: asked } },
      { createdAt: new Date("2026-08-10T09:00:00.000Z"), booking: { createdAt: asked } },
    ] as never);

    const stats = await coachConsoleStats("coach-1", NOW);

    expect(stats.medianAnswerHours).toBe(4);
  });

  it("reads the platform cut from every delivered booking, not just the recent ones", async () => {
    mockPrisma.booking.aggregate.mockResolvedValue({
      _sum: { platformFeeCents: 3900 },
    } as never);

    const stats = await coachConsoleStats("coach-1", NOW);

    expect(stats.platformFeeCents).toBe(3900);
    expect(mockPrisma.booking.aggregate.mock.calls[0][0].where).not.toHaveProperty("deliveredAt");
  });
});

describe("listingPerformance", () => {
  // The two groupBy calls run in the order the service issues them.
  function withBookings(
    byListing: { listingId: string; count: number }[],
    byStatus: { listingId: string; status: string; count: number }[]
  ): void {
    mockPrisma.booking.groupBy
      .mockResolvedValueOnce(
        byListing.map((r) => ({ listingId: r.listingId, _count: { _all: r.count } })) as never
      )
      .mockResolvedValueOnce(
        byStatus.map((r) => ({
          listingId: r.listingId,
          status: r.status,
          _count: { _all: r.count },
        })) as never
      );
  }

  it("leaves an undecided request out of the accept rate entirely", async () => {
    withBookings(
      [{ listingId: "l1", count: 5 }],
      [
        { listingId: "l1", status: "PENDING_COACH", count: 2 },
        { listingId: "l1", status: "COMPLETED", count: 3 },
      ]
    );

    const perf = await listingPerformance("coach-1");

    expect(perf.get("l1")).toMatchObject({ requests: 5, acceptRate: 1, delivered: 3 });
  });

  it("counts a declined and an expired request against the listing", async () => {
    withBookings(
      [{ listingId: "l1", count: 4 }],
      [
        { listingId: "l1", status: "COMPLETED", count: 2 },
        { listingId: "l1", status: "DECLINED", count: 1 },
        { listingId: "l1", status: "EXPIRED", count: 1 },
      ]
    );

    const perf = await listingPerformance("coach-1");

    expect(perf.get("l1")?.acceptRate).toBe(0.5);
  });

  it("has no rate and no rating on a listing nobody has booked", async () => {
    withBookings([{ listingId: "l1", count: 0 }], []);

    const perf = await listingPerformance("coach-1");

    expect(perf.get("l1")).toMatchObject({ acceptRate: null, rating: null });
  });

  it("averages only the revealed student reviews on that listing", async () => {
    withBookings(
      [{ listingId: "l1", count: 2 }],
      [{ listingId: "l1", status: "COMPLETED", count: 2 }]
    );
    mockPrisma.sessionReview.findMany.mockResolvedValue([
      { rating: 5, booking: { listingId: "l1" } },
      { rating: 4, booking: { listingId: "l1" } },
      { rating: 1, booking: { listingId: "other" } },
    ] as never);

    const perf = await listingPerformance("coach-1");

    expect(perf.get("l1")?.rating).toBe(4.5);
    expect(mockPrisma.sessionReview.findMany.mock.calls[0][0]?.where).toMatchObject({
      authorRole: "STUDENT",
      revealedAt: { not: null },
    });
  });
});
