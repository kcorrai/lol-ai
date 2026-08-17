import type { BookingStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { holdsFunds, refundsAutomatically } from "@/domains/marketplace/transitions";
import { manualProvider } from "@/domains/marketplace/services/payments/manualProvider";
import type { PaymentProvider } from "@/domains/marketplace/services/payments/paymentProvider";

// The money ledger, provider-neutral.
//
// One row per booking, holding what was taken, what the platform's cut is, what
// the coach is owed, and which of those has actually happened. No money moves
// today — the only driver is `manual` — but the states are real, because the
// expensive part of marketplace payments is the state machine and not the API
// calls (ADR-020).

/** Swappable so a Stripe driver is a registration, not an edit to this file. */
let provider: PaymentProvider = manualProvider;

export function setPaymentProvider(next: PaymentProvider): void {
  provider = next;
}

export function currentPaymentProvider(): PaymentProvider {
  return provider;
}

type Db = Prisma.TransactionClient | typeof prisma;

interface BookingMoney {
  id: string;
  priceCents: number;
  platformFeeCents: number;
  coachEarningsCents: number;
  currency: string;
  coachProfileId: string;
}

/**
 * Open the ledger for a booking.
 *
 * Called when the booking is created, so a booking without a payment row is a
 * bug rather than a normal state — there is no moment in the lifecycle where
 * money is undecided.
 */
export async function openPayment(booking: BookingMoney, db: Db = prisma): Promise<void> {
  const destinationAccountId = await payoutAccountId(booking.coachProfileId, db);

  const result = await provider.charge({
    bookingId: booking.id,
    amountCents: booking.priceCents,
    platformFeeCents: booking.platformFeeCents,
    coachAmountCents: booking.coachEarningsCents,
    currency: booking.currency,
    destinationAccountId,
  });

  await db.bookingPayment.create({
    data: {
      bookingId: booking.id,
      provider: provider.name,
      status: result.status,
      amountCents: booking.priceCents,
      platformFeeCents: booking.platformFeeCents,
      coachAmountCents: booking.coachEarningsCents,
      currency: booking.currency,
      providerPaymentId: result.providerPaymentId,
      capturedAt: result.status === "HELD" ? new Date() : null,
    },
  });
}

/**
 * Settle a booking's money to match where the booking ended up.
 *
 * Driven by the booking's status rather than called separately for each
 * outcome, so the two can never disagree: money is held while the booking is
 * live, released when it completes, and returned when it ends any other way.
 */
export async function settleForStatus(
  bookingId: string,
  status: BookingStatus
): Promise<PaymentStatus | null> {
  const payment = await prisma.bookingPayment.findUnique({
    where: { bookingId },
    select: {
      id: true,
      status: true,
      amountCents: true,
      platformFeeCents: true,
      coachAmountCents: true,
      currency: true,
      providerPaymentId: true,
      booking: { select: { coachProfileId: true } },
    },
  });

  if (!payment) return null;
  // Already settled. Re-settling would double-count a transfer under a driver
  // that actually moves money.
  if (payment.status === "RELEASED" || payment.status === "REFUNDED") return payment.status;
  if (holdsFunds(status)) return payment.status;

  const request = {
    bookingId,
    amountCents: payment.amountCents,
    platformFeeCents: payment.platformFeeCents,
    coachAmountCents: payment.coachAmountCents,
    currency: payment.currency,
    destinationAccountId: await payoutAccountId(payment.booking.coachProfileId),
    providerPaymentId: payment.providerPaymentId,
  };

  if (status === "COMPLETED") {
    const released = await provider.release(request);
    await prisma.bookingPayment.update({
      where: { id: payment.id },
      data: {
        status: released.status,
        providerTransferId: released.providerTransferId,
        releasedAt: new Date(),
      },
    });
    logger.info("[marketplace] payment released", { bookingId, provider: provider.name });
    return released.status;
  }

  // Everything else a booking can end as means the session did not happen as
  // sold — declined, expired, cancelled by either side, or refunded out of a
  // dispute. The student gets their money back without anybody deciding.
  if (refundsAutomatically(status) || status === "REFUNDED") {
    const refunded = await provider.refund(request);
    await prisma.bookingPayment.update({
      where: { id: payment.id },
      data: { status: refunded.status, refundedAt: new Date() },
    });
    logger.info("[marketplace] payment refunded", { bookingId, provider: provider.name });
    return refunded.status;
  }

  return payment.status;
}

/** What a booking's money is doing, for the session page. */
export async function paymentFor(bookingId: string) {
  return prisma.bookingPayment.findUnique({
    where: { bookingId },
    select: {
      provider: true,
      status: true,
      amountCents: true,
      platformFeeCents: true,
      coachAmountCents: true,
      currency: true,
      capturedAt: true,
      releasedAt: true,
      refundedAt: true,
    },
  });
}

/** The coach's payout account at the current provider, if they have one. */
async function payoutAccountId(coachProfileId: string, db: Db = prisma): Promise<string | null> {
  const account = await db.coachPayoutAccount.findUnique({
    where: { coachProfileId },
    select: { provider: true, providerAccountId: true, payoutsEnabled: true },
  });

  if (!account || account.provider !== provider.name || !account.payoutsEnabled) return null;
  return account.providerAccountId;
}
