import type {
  ChargeRequest,
  ChargeResult,
  PaymentProvider,
  RefundResult,
  ReleaseResult,
} from "@/domains/marketplace/services/payments/paymentProvider";

/**
 * The driver that settles nothing.
 *
 * It exists so the ledger, its states and everything that reads them are real
 * and exercised before any money is involved — Kaan's call, and the right one:
 * the expensive part of a marketplace's payment code is the state machine, not
 * the API calls, and building it under a provider that cannot take a payment
 * means every wrong assumption surfaces without a refund attached.
 *
 * It returns no provider ids because there is no provider. A booking settled
 * here has `providerPaymentId` null for ever, which is exactly what the data
 * should say about a session nobody paid for.
 */
export const manualProvider: PaymentProvider = {
  name: "manual",
  movesMoney: false,

  async charge(_request: ChargeRequest): Promise<ChargeResult> {
    // Straight to HELD. There is no authorization step to wait on, and leaving
    // it in REQUIRES_PAYMENT would make every booking look unpaid.
    return { providerPaymentId: null, status: "HELD" };
  },

  async release(_request): Promise<ReleaseResult> {
    return { providerTransferId: null, status: "RELEASED" };
  },

  async refund(_request): Promise<RefundResult> {
    return { status: "REFUNDED" };
  },
};
