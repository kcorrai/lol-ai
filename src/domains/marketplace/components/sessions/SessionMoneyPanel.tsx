"use client";

import { formatMoney } from "@/domains/marketplace/money";
import type { BookingPaymentView } from "@/domains/marketplace/types";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { MeterRow } from "@/domains/marketplace/components/hud/MeterRow";

/**
 * This booking's ledger row, spelled out.
 *
 * The disclosure is on the panel header, not buried at the bottom: a figure
 * that has never moved has to be labelled as such on the same line somebody
 * reads it (ADR-020).
 */
export function SessionMoneyPanel({
  payment,
}: {
  payment: BookingPaymentView;
}): React.ReactElement {
  const released = payment.status === "RELEASED";
  const refunded = payment.status === "REFUNDED";

  return (
    <HudPanel
      label="Money"
      action={
        payment.provider === "manual" && (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-warning">
            No payment provider connected — the ledger records what would have moved
          </span>
        )
      }
    >
      <p className="flex flex-wrap items-baseline gap-3.5">
        <span className="font-mono text-[28px] font-bold leading-none text-text">
          {formatMoney(payment.amountCents, payment.currency, true)}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
          coach {formatMoney(payment.coachAmountCents, payment.currency, true)} &middot; platform{" "}
          {formatMoney(payment.platformFeeCents, payment.currency, true)}
        </span>
      </p>

      <div className="mt-4 grid max-w-[520px] gap-3">
        <MeterRow
          label={
            released
              ? "Released to the coach"
              : refunded
                ? "Returned to the student"
                : "Held until settled"
          }
          value={formatMoney(payment.coachAmountCents, payment.currency, true)}
          percent={(payment.coachAmountCents / Math.max(1, payment.amountCents)) * 100}
          tone={released ? "accent" : "muted"}
        />
        <MeterRow
          label="Platform cut"
          value={formatMoney(payment.platformFeeCents, payment.currency, true)}
          percent={(payment.platformFeeCents / Math.max(1, payment.amountCents)) * 100}
          tone="info"
        />
      </div>

      <p className="mt-4 text-[13px] text-text-muted">{line(payment)}</p>
    </HudPanel>
  );
}

function line(payment: BookingPaymentView): string {
  switch (payment.status) {
    case "HELD":
      return "Held until the session settles — on confirmation, or automatically once the challenge window closes.";
    case "RELEASED":
      return "Released to the coach. The ledger records the movement even though no provider is connected.";
    case "REFUNDED":
      return "Returned to the student.";
    case "FAILED":
      return "The payment failed.";
    default:
      return "Not taken yet.";
  }
}
