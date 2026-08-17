import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  openPayment,
  settleForStatus,
  setPaymentProvider,
  currentPaymentProvider,
} from "@/domains/marketplace/services/payments/paymentService";
import { manualProvider } from "@/domains/marketplace/services/payments/manualProvider";
import type { PaymentProvider } from "@/domains/marketplace/services/payments/paymentProvider";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    bookingPayment: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    coachPayoutAccount: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockPrisma = vi.mocked(prisma, true);

const BOOKING = {
  id: "b1",
  priceCents: 4500,
  platformFeeCents: 900,
  coachEarningsCents: 3600,
  currency: "USD",
  coachProfileId: "coach-1",
};

function payment(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    status: "HELD",
    amountCents: 4500,
    platformFeeCents: 900,
    coachAmountCents: 3600,
    currency: "USD",
    providerPaymentId: null,
    booking: { coachProfileId: "coach-1" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setPaymentProvider(manualProvider);
  mockPrisma.coachPayoutAccount.findUnique.mockResolvedValue(null as never);
  mockPrisma.bookingPayment.findUnique.mockResolvedValue(payment() as never);
  mockPrisma.bookingPayment.update.mockResolvedValue({} as never);
  mockPrisma.bookingPayment.create.mockResolvedValue({} as never);
});

afterEach(() => setPaymentProvider(manualProvider));

describe("the manual driver", () => {
  it("settles nothing, and says so", () => {
    expect(manualProvider.movesMoney).toBe(false);
    expect(currentPaymentProvider().name).toBe("manual");
  });
});

describe("openPayment", () => {
  it("opens the ledger with the booking's own split", async () => {
    await openPayment(BOOKING);

    expect(mockPrisma.bookingPayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingId: "b1",
        provider: "manual",
        status: "HELD",
        amountCents: 4500,
        platformFeeCents: 900,
        coachAmountCents: 3600,
      }),
    });
  });

  // There is no provider, so there is no provider id — and that is exactly
  // what the data should say about a session nobody paid for.
  it("records no provider id under a driver that moves nothing", async () => {
    await openPayment(BOOKING);

    expect(mockPrisma.bookingPayment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ providerPaymentId: null }),
    });
  });

  it("ignores a payout account belonging to a different provider", async () => {
    mockPrisma.coachPayoutAccount.findUnique.mockResolvedValue({
      provider: "stripe",
      providerAccountId: "acct_123",
      payoutsEnabled: true,
    } as never);

    const seen: (string | null)[] = [];
    setPaymentProvider({
      ...manualProvider,
      charge: async (request) => {
        seen.push(request.destinationAccountId);
        return { providerPaymentId: null, status: "HELD" };
      },
    } as PaymentProvider);

    await openPayment(BOOKING);

    expect(seen).toEqual([null]);
  });

  it("ignores an account of the right provider that cannot receive payouts yet", async () => {
    mockPrisma.coachPayoutAccount.findUnique.mockResolvedValue({
      provider: "manual",
      providerAccountId: "acct_123",
      payoutsEnabled: false,
    } as never);

    const seen: (string | null)[] = [];
    setPaymentProvider({
      ...manualProvider,
      charge: async (request) => {
        seen.push(request.destinationAccountId);
        return { providerPaymentId: null, status: "HELD" };
      },
    } as PaymentProvider);

    await openPayment(BOOKING);

    expect(seen).toEqual([null]);
  });
});

describe("settleForStatus", () => {
  // Money is held while the booking is live and settles only when it is not,
  // so the two can never disagree about what happened.
  it.each(["PENDING_COACH", "CONFIRMED", "DELIVERED", "DISPUTED"] as const)(
    "leaves the money held while the booking is %s",
    async (status) => {
      expect(await settleForStatus("b1", status)).toBe("HELD");
      expect(mockPrisma.bookingPayment.update).not.toHaveBeenCalled();
    }
  );

  it("releases on completion", async () => {
    expect(await settleForStatus("b1", "COMPLETED")).toBe("RELEASED");

    expect(mockPrisma.bookingPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "RELEASED", releasedAt: expect.any(Date) }),
      })
    );
  });

  it.each(["DECLINED", "EXPIRED", "CANCELLED_BY_STUDENT", "CANCELLED_BY_COACH", "REFUNDED"] as const)(
    "refunds when a booking ends as %s",
    async (status) => {
      expect(await settleForStatus("b1", status)).toBe("REFUNDED");

      expect(mockPrisma.bookingPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "REFUNDED", refundedAt: expect.any(Date) }),
        })
      );
    }
  );

  // Re-settling would double-count a transfer under a driver that actually
  // moves money.
  it("does nothing to money that has already settled", async () => {
    mockPrisma.bookingPayment.findUnique.mockResolvedValue(payment({ status: "RELEASED" }) as never);
    expect(await settleForStatus("b1", "COMPLETED")).toBe("RELEASED");

    mockPrisma.bookingPayment.findUnique.mockResolvedValue(payment({ status: "REFUNDED" }) as never);
    expect(await settleForStatus("b1", "EXPIRED")).toBe("REFUNDED");

    expect(mockPrisma.bookingPayment.update).not.toHaveBeenCalled();
  });

  it("answers null for a booking with no ledger row", async () => {
    mockPrisma.bookingPayment.findUnique.mockResolvedValue(null as never);

    expect(await settleForStatus("b1", "COMPLETED")).toBeNull();
  });

  it("hands the driver the ledger's own figures, not fresh ones", async () => {
    const charged: number[] = [];
    setPaymentProvider({
      ...manualProvider,
      release: async (request) => {
        charged.push(request.coachAmountCents, request.platformFeeCents);
        return { providerTransferId: "tr_1", status: "RELEASED" };
      },
    } as PaymentProvider);

    await settleForStatus("b1", "COMPLETED");

    expect(charged).toEqual([3600, 900]);
    expect(mockPrisma.bookingPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ providerTransferId: "tr_1" }),
      })
    );
  });
});
