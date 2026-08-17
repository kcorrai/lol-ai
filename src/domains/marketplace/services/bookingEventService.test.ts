import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { transition, recordCreation } from "@/domains/marketplace/services/bookingEventService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    booking: { updateMany: vi.fn() },
    bookingEvent: { create: vi.fn(), findMany: vi.fn() },
  },
}));

const mockPrisma = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.booking.updateMany.mockResolvedValue({ count: 1 } as never);
  mockPrisma.bookingEvent.create.mockResolvedValue({} as never);
});

describe("transition", () => {
  it("moves the booking and records the move together", async () => {
    const result = await transition({
      bookingId: "b1",
      from: "PENDING_COACH",
      to: "CONFIRMED",
      actorId: "coach-1",
      reason: "Accepted by the coach.",
    });

    expect(result).toEqual({ ok: true });
    expect(mockPrisma.bookingEvent.create).toHaveBeenCalledWith({
      data: {
        bookingId: "b1",
        actorId: "coach-1",
        fromStatus: "PENDING_COACH",
        toStatus: "CONFIRMED",
        reason: "Accepted by the coach.",
      },
    });
  });

  // The guard is the whole reason this takes `from`: two requests racing to
  // accept the same booking must not both succeed.
  it("guards the update on the status it read", async () => {
    await transition({ bookingId: "b1", from: "PENDING_COACH", to: "CONFIRMED" });

    expect(mockPrisma.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "b1", status: "PENDING_COACH" },
      })
    );
  });

  it("reports a booking that moved underneath it, and records nothing", async () => {
    mockPrisma.booking.updateMany.mockResolvedValue({ count: 0 } as never);

    expect(await transition({ bookingId: "b1", from: "PENDING_COACH", to: "CONFIRMED" })).toEqual({
      ok: false,
      reason: "stale",
    });
    expect(mockPrisma.bookingEvent.create).not.toHaveBeenCalled();
  });

  // A service cannot invent a move by writing `status` directly, because this
  // is the only path and it checks the table first.
  it("refuses a move the state machine does not allow, without touching the row", async () => {
    expect(await transition({ bookingId: "b1", from: "PENDING_COACH", to: "COMPLETED" })).toEqual({
      ok: false,
      reason: "illegal-transition",
    });
    expect(mockPrisma.booking.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.bookingEvent.create).not.toHaveBeenCalled();
  });

  it("refuses to move a terminal booking at all", async () => {
    expect(await transition({ bookingId: "b1", from: "REFUNDED", to: "COMPLETED" })).toEqual({
      ok: false,
      reason: "illegal-transition",
    });
  });

  it("carries the extra columns a status implies", async () => {
    const deliveredAt = new Date("2026-08-17T12:00:00Z");

    await transition({
      bookingId: "b1",
      from: "CONFIRMED",
      to: "DELIVERED",
      data: { deliveredAt },
    });

    expect(mockPrisma.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "DELIVERED", deliveredAt }),
      })
    );
  });

  // A sweep is not a person, and attributing its work to one would be a lie in
  // the record a dispute gets settled against.
  it("records a null actor when nobody did it", async () => {
    await transition({
      bookingId: "b1",
      from: "PENDING_COACH",
      to: "EXPIRED",
      actorId: null,
      reason: "The coach did not answer in time.",
    });

    expect(mockPrisma.bookingEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ actorId: null }) })
    );
  });
});

describe("recordCreation", () => {
  // A first row with a fabricated previous status would read as a transition
  // that never happened.
  it("writes a null `from`, because nothing preceded it", async () => {
    await recordCreation("b1", "student-1");

    expect(mockPrisma.bookingEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: null,
          toStatus: "PENDING_COACH",
          actorId: "student-1",
        }),
      })
    );
  });
});
