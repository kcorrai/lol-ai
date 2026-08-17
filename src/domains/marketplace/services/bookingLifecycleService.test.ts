import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { transition } from "@/domains/marketplace/services/bookingEventService";
import {
  acceptBooking,
  declineBooking,
  cancelBooking,
  markDelivered,
  confirmDelivery,
} from "@/domains/marketplace/services/bookingLifecycleService";
import { expireBooking } from "@/domains/marketplace/services/bookingSweepService";

vi.mock("@/lib/db/prisma", () => ({ prisma: { booking: { findUnique: vi.fn() } } }));
vi.mock("@/domains/marketplace/services/bookingEventService", () => ({
  transition: vi.fn(),
}));
vi.mock("@/domains/marketplace/services/payments/paymentService", () => ({
  settleForStatus: vi.fn(),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockPrisma = vi.mocked(prisma, true);
const mockTransition = vi.mocked(transition);

const STUDENT = "student-1";
const COACH = "coach-user";

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: "b1",
    status: "PENDING_COACH",
    startTime: new Date("2026-08-20T15:00:00Z"),
    cancellationHours: 24,
    studentId: STUDENT,
    coachProfile: { userId: COACH },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTransition.mockResolvedValue({ ok: true });
  mockPrisma.booking.findUnique.mockResolvedValue(booking() as never);
});

describe("who is allowed to do what", () => {
  it("lets the coach accept and not the student", async () => {
    expect(await acceptBooking("b1", COACH)).toEqual({ ok: true });

    expect(await acceptBooking("b1", STUDENT)).toEqual({ ok: false, reason: "forbidden" });
  });

  it("lets the coach deliver and not the student", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(booking({ status: "CONFIRMED" }) as never);

    expect(await markDelivered("b1", COACH)).toEqual({ ok: true });
    expect(await markDelivered("b1", STUDENT)).toEqual({ ok: false, reason: "forbidden" });
  });

  it("lets the student confirm and not the coach", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(booking({ status: "DELIVERED" }) as never);

    expect(await confirmDelivery("b1", STUDENT)).toEqual({ ok: true });
    expect(await confirmDelivery("b1", COACH)).toEqual({ ok: false, reason: "forbidden" });
  });

  // A stranger probing ids gets the same answer as somebody asking about a
  // booking that does not exist.
  it("tells a stranger nothing, in the same words as a missing booking", async () => {
    expect(await acceptBooking("b1", "someone-else")).toEqual({ ok: false, reason: "not-found" });

    mockPrisma.booking.findUnique.mockResolvedValue(null as never);
    expect(await acceptBooking("b1", COACH)).toEqual({ ok: false, reason: "not-found" });
  });
});

describe("acceptBooking", () => {
  it("stores the meeting link when the coach supplies one", async () => {
    await acceptBooking("b1", COACH, "https://discord.gg/x");

    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "CONFIRMED",
        actorId: COACH,
        data: { meetingUrl: "https://discord.gg/x" },
      })
    );
  });

  it("passes no data at all when there is no link", async () => {
    await acceptBooking("b1", COACH, null);

    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({ to: "CONFIRMED", data: undefined })
    );
  });
});

describe("declineBooking", () => {
  it("carries the reason into the record", async () => {
    await declineBooking("b1", COACH, "I do not coach this matchup.");

    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "DECLINED",
        reason: "I do not coach this matchup.",
        data: expect.objectContaining({ cancelReason: "I do not coach this matchup." }),
      })
    );
  });
});

describe("cancelBooking", () => {
  const inWindow = new Date("2026-08-20T10:00:00Z"); // 5 hours before
  const outsideWindow = new Date("2026-08-18T10:00:00Z");

  it("lets a student cancel outside the window", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(booking({ status: "CONFIRMED" }) as never);

    expect(await cancelBooking("b1", STUDENT, "Something came up.", outsideWindow)).toEqual({
      ok: true,
    });
    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({ to: "CANCELLED_BY_STUDENT" })
    );
  });

  // The terms were snapshotted onto the booking when the student agreed to
  // them; this is where they are held to.
  it("refuses a student inside the window rather than charging them quietly", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(booking({ status: "CONFIRMED" }) as never);

    expect(await cancelBooking("b1", STUDENT, "Something came up.", inWindow)).toEqual({
      ok: false,
      reason: "too-late",
    });
    expect(mockTransition).not.toHaveBeenCalled();
  });

  it("does not hold a student to the window on a request nobody has accepted", async () => {
    expect(await cancelBooking("b1", STUDENT, "Changed my mind.", inWindow)).toEqual({ ok: true });
  });

  // A session cannot happen without the coach; refusing them just produces a
  // no-show instead. It is recorded as their cancellation, which is what an
  // automatic refund keys off.
  it("always lets the coach cancel, and records it as theirs", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(booking({ status: "CONFIRMED" }) as never);

    expect(await cancelBooking("b1", COACH, "I am ill.", inWindow)).toEqual({ ok: true });
    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({ to: "CANCELLED_BY_COACH" })
    );
  });
});

describe("markDelivered", () => {
  // Delivery starts the clock the student can challenge it on; it settles
  // nothing by itself.
  it("sets the moment it stops being challengeable", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(booking({ status: "CONFIRMED" }) as never);
    const now = new Date("2026-08-20T16:00:00Z");

    await markDelivered("b1", COACH, now);

    const data = mockTransition.mock.calls[0][0].data as {
      deliveredAt: Date;
      autoCompleteAt: Date;
    };
    expect(data.deliveredAt).toEqual(now);
    expect(data.autoCompleteAt.toISOString()).toBe("2026-08-23T16:00:00.000Z");
  });
});

describe("expireBooking", () => {
  it("is nobody's doing, and says so", async () => {
    await expireBooking("b1");

    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "PENDING_COACH",
        to: "EXPIRED",
        actorId: null,
      })
    );
  });
});

describe("outcome mapping", () => {
  it("reports a booking that moved underneath the request", async () => {
    mockTransition.mockResolvedValue({ ok: false, reason: "stale" });

    expect(await acceptBooking("b1", COACH)).toEqual({ ok: false, reason: "stale" });
  });

  it("reports a move the state machine refused", async () => {
    mockTransition.mockResolvedValue({ ok: false, reason: "illegal-transition" });

    expect(await acceptBooking("b1", COACH)).toEqual({ ok: false, reason: "illegal" });
  });
});
