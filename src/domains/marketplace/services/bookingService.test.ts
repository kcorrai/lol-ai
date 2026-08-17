import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { withUserLock } from "@/lib/db/userLock";
import { isSlotFree } from "@/domains/marketplace/services/slotService";
import { createBooking } from "@/domains/marketplace/services/bookingService";
import type { BookingRequest } from "@/domains/marketplace/services/bookingService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coachListing: { findFirst: vi.fn() },
    riotAccount: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/db/userLock", () => ({ withUserLock: vi.fn() }));
vi.mock("@/domains/marketplace/services/slotService", () => ({ isSlotFree: vi.fn() }));
vi.mock("@/domains/marketplace/services/bookingEventService", () => ({
  recordCreation: vi.fn(),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockPrisma = vi.mocked(prisma, true);
const mockLock = vi.mocked(withUserLock);
const mockSlotFree = vi.mocked(isSlotFree);

const tx = { booking: { create: vi.fn() } };

const LIVE_LISTING = {
  id: "listing-1",
  kind: "LIVE_SESSION" as const,
  durationMinutes: 60,
  priceCents: 4500,
  currency: "USD",
  coachProfileId: "coach-1",
  coachProfile: {
    id: "coach-1",
    userId: "coach-user",
    status: "APPROVED" as const,
    acceptingStudents: true,
    commissionBps: 2000,
    timezone: "Europe/Istanbul",
  },
};

const VOD_LISTING = { ...LIVE_LISTING, kind: "VOD_REVIEW" as const };

const REQUEST: BookingRequest = {
  studentId: "student-1",
  listingId: "listing-1",
  startTime: new Date("2026-08-20T15:00:00Z"),
  studentGoal: "I keep losing games I was ahead in.",
  studentTimezone: "Europe/London",
};

beforeEach(() => {
  vi.clearAllMocks();
  tx.booking.create.mockResolvedValue({ id: "booking-1" });
  mockLock.mockImplementation(async (_key, fn) => fn(tx as never));
  mockSlotFree.mockResolvedValue(true);
  mockPrisma.coachListing.findFirst.mockResolvedValue(LIVE_LISTING as never);
});

describe("createBooking", () => {
  it("creates a request and snapshots the money onto it", async () => {
    const result = await createBooking(REQUEST);

    expect(result).toEqual({ ok: true, bookingId: "booking-1" });
    expect(tx.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING_COACH",
          priceCents: 4500,
          commissionBps: 2000,
          platformFeeCents: 900,
          coachEarningsCents: 3600,
        }),
      })
    );
  });

  it("derives the end time from the listing, not from the request", async () => {
    await createBooking(REQUEST);

    const data = tx.booking.create.mock.calls[0][0].data as { endTime: Date };
    expect(data.endTime.toISOString()).toBe("2026-08-20T16:00:00.000Z");
  });

  it("captures both timezones", async () => {
    await createBooking(REQUEST);

    expect(tx.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          studentTimezone: "Europe/London",
          coachTimezone: "Europe/Istanbul",
        }),
      })
    );
  });

  // Without the lock two students both read "free" and both insert, and the
  // coach wakes up double-booked with no way to tell which was first.
  it("does the check and the write under a lock on the coach", async () => {
    await createBooking(REQUEST);

    expect(mockLock).toHaveBeenCalledWith("coach:coach-1", expect.any(Function));
    expect(mockSlotFree).toHaveBeenCalledWith(
      "coach-1",
      REQUEST.startTime,
      60,
      expect.any(Date)
    );
  });

  it("refuses a slot that went while the page was open", async () => {
    mockSlotFree.mockResolvedValue(false);

    expect(await createBooking(REQUEST)).toEqual({ ok: false, reason: "slot-taken" });
    expect(tx.booking.create).not.toHaveBeenCalled();
  });

  it("refuses a scheduled session with no time", async () => {
    expect(await createBooking({ ...REQUEST, startTime: null })).toEqual({
      ok: false,
      reason: "slot-required",
    });
  });

  it("refuses a listing that is not on sale or whose coach is not approved", async () => {
    mockPrisma.coachListing.findFirst.mockResolvedValue(null as never);
    expect(await createBooking(REQUEST)).toEqual({ ok: false, reason: "listing-not-found" });

    mockPrisma.coachListing.findFirst.mockResolvedValue({
      ...LIVE_LISTING,
      coachProfile: { ...LIVE_LISTING.coachProfile, status: "SUSPENDED" },
    } as never);
    expect(await createBooking(REQUEST)).toEqual({ ok: false, reason: "listing-not-found" });
  });

  it("refuses a coach who has paused", async () => {
    mockPrisma.coachListing.findFirst.mockResolvedValue({
      ...LIVE_LISTING,
      coachProfile: { ...LIVE_LISTING.coachProfile, acceptingStudents: false },
    } as never);

    expect(await createBooking(REQUEST)).toEqual({ ok: false, reason: "not-accepting" });
  });

  // Booking yourself would settle money in a circle and pollute your own
  // review count.
  it("refuses a coach booking themselves", async () => {
    expect(await createBooking({ ...REQUEST, studentId: "coach-user" })).toEqual({
      ok: false,
      reason: "self-booking",
    });
  });

  describe("async reviews", () => {
    beforeEach(() => {
      mockPrisma.coachListing.findFirst.mockResolvedValue(VOD_LISTING as never);
    });

    it("needs no slot and no slot check", async () => {
      const result = await createBooking({
        ...REQUEST,
        startTime: null,
        matchIds: ["TR1_123"],
      });

      expect(result.ok).toBe(true);
      expect(mockSlotFree).not.toHaveBeenCalled();
    });

    it("stores no start or end time", async () => {
      await createBooking({ ...REQUEST, startTime: null, matchIds: ["TR1_123"] });

      expect(tx.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ startTime: null, endTime: null }),
        })
      );
    });

    // A review with nothing to review is a session the coach cannot start.
    it("refuses one with neither a match nor a video", async () => {
      expect(
        await createBooking({ ...REQUEST, startTime: null, matchIds: [], vodUrl: null })
      ).toEqual({ ok: false, reason: "material-required" });
    });

    it("accepts a video link on its own", async () => {
      const result = await createBooking({
        ...REQUEST,
        startTime: null,
        vodUrl: "https://youtube.com/watch?v=x",
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("riot account", () => {
    it("refuses an account the student does not own", async () => {
      mockPrisma.riotAccount.findFirst.mockResolvedValue(null as never);

      expect(await createBooking({ ...REQUEST, riotAccountId: "somebody-elses" })).toEqual({
        ok: false,
        reason: "account-not-owned",
      });
    });

    it("accepts one they do", async () => {
      mockPrisma.riotAccount.findFirst.mockResolvedValue({ id: "riot-1" } as never);

      const result = await createBooking({ ...REQUEST, riotAccountId: "riot-1" });
      expect(result.ok).toBe(true);
    });
  });
});
