import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { autoComplete, expireBooking } from "@/domains/marketplace/services/bookingSweepService";
import { revealExpired } from "@/domains/marketplace/services/reviewService";
import { sendSessionReminders } from "@/domains/marketplace/services/reminderService";
import {
  expireUnanswered,
  completeUnchallenged,
  runBookingSweeps,
} from "@/domains/marketplace/services/bookingSweeps";

vi.mock("@/lib/db/prisma", () => ({ prisma: { booking: { findMany: vi.fn() } } }));
vi.mock("@/domains/marketplace/services/bookingSweepService", () => ({
  autoComplete: vi.fn(),
  expireBooking: vi.fn(),
}));
vi.mock("@/domains/marketplace/services/reviewService", () => ({ revealExpired: vi.fn() }));
vi.mock("@/domains/marketplace/services/reminderService", () => ({ sendSessionReminders: vi.fn() }));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockPrisma = vi.mocked(prisma, true);
const mockExpire = vi.mocked(expireBooking);
const mockComplete = vi.mocked(autoComplete);
const mockReveal = vi.mocked(revealExpired);
const mockRemind = vi.mocked(sendSessionReminders);

const NOW = new Date("2026-08-18T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.findMany.mockResolvedValue([] as never);
  mockExpire.mockResolvedValue({ ok: true });
  mockComplete.mockResolvedValue({ ok: true });
  mockReveal.mockResolvedValue(0);
  mockRemind.mockResolvedValue(0);
});

describe("expireUnanswered", () => {
  it("takes only requests whose deadline has passed, oldest first", async () => {
    await expireUnanswered(NOW);

    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDING_COACH", respondByAt: { lte: NOW } },
        orderBy: { respondByAt: "asc" },
      })
    );
  });

  it("counts only the ones that actually moved", async () => {
    mockPrisma.booking.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }] as never);
    mockExpire.mockResolvedValueOnce({ ok: true }).mockResolvedValueOnce({
      ok: false,
      reason: "stale",
    });

    expect(await expireUnanswered(NOW)).toBe(1);
  });

  it("is bounded per run", async () => {
    await expireUnanswered(NOW, 50);

    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });
});

describe("completeUnchallenged", () => {
  it("takes only deliveries whose window has closed", async () => {
    await completeUnchallenged(NOW);

    expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "DELIVERED", autoCompleteAt: { not: null, lte: NOW } },
      })
    );
  });

  // The guarded transition underneath refuses a booking that has since been
  // disputed, and this must not count that as a completion.
  it("does not count a booking that moved underneath it", async () => {
    mockPrisma.booking.findMany.mockResolvedValue([{ id: "a" }] as never);
    mockComplete.mockResolvedValue({ ok: false, reason: "stale" });

    expect(await completeUnchallenged(NOW)).toBe(0);
  });
});

describe("runBookingSweeps", () => {
  it("reports what each sweep did", async () => {
    mockPrisma.booking.findMany
      .mockResolvedValueOnce([{ id: "a" }] as never)
      .mockResolvedValueOnce([{ id: "b" }, { id: "c" }] as never);
    mockReveal.mockResolvedValue(4);

    mockRemind.mockResolvedValue(6);

    expect(await runBookingSweeps(NOW)).toEqual({
      expired: 1,
      completed: 2,
      reviewsRevealed: 4,
      remindersSent: 6,
      failed: 0,
    });
  });

  // A stuck expiry leaving deliveries unsettled would turn one problem into two.
  it("keeps going when one sweep throws, and says one failed", async () => {
    mockPrisma.booking.findMany.mockRejectedValueOnce(new Error("database is having a day"));
    mockReveal.mockResolvedValue(3);

    const report = await runBookingSweeps(NOW);

    expect(report.failed).toBe(1);
    expect(report.expired).toBe(0);
    expect(report.reviewsRevealed).toBe(3);
  });
});
