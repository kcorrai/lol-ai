import type { PaymentStatus } from "@prisma/client";

// The seam Stripe drops into.
//
// A driver's job is to move money and hand back provider ids; the ledger's job
// is to know what state a booking's money is in and why. Keeping them apart is
// what makes adding Stripe a new file rather than a rewrite — the states,
// the transitions and everything that reads them already exist and are already
// exercised by the driver that moves nothing (ADR-020).

export interface ChargeRequest {
  bookingId: string;
  amountCents: number;
  platformFeeCents: number;
  coachAmountCents: number;
  currency: string;
  /** The coach's payout account at the provider, when there is one. */
  destinationAccountId: string | null;
}

export interface ChargeResult {
  /** `PaymentIntent.id` under Stripe. */
  providerPaymentId: string | null;
  status: PaymentStatus;
}

export interface ReleaseResult {
  /** `Transfer.id` under Stripe. */
  providerTransferId: string | null;
  status: PaymentStatus;
}

export interface RefundResult {
  status: PaymentStatus;
}

/**
 * What any payment driver has to be able to do.
 *
 * Four verbs, which is the whole of what a marketplace booking needs: take the
 * money, hold it while the session is still challengeable, release it to the
 * coach, or give it back. Stripe maps onto these directly — a destination
 * charge with an `application_fee_amount`, a manual payout schedule for the
 * hold, `Payout.create` for the release, and
 * `Refund.create({ reverse_transfer: true, refund_application_fee: true })`.
 */
export interface PaymentProvider {
  readonly name: string;
  /** Whether this driver actually settles anything. `false` for `manual`. */
  readonly movesMoney: boolean;

  charge(request: ChargeRequest): Promise<ChargeResult>;
  release(request: ChargeRequest & { providerPaymentId: string | null }): Promise<ReleaseResult>;
  refund(request: ChargeRequest & { providerPaymentId: string | null }): Promise<RefundResult>;
}
