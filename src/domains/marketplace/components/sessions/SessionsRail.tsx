"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/uiLocale";
import { holdsFunds } from "@/domains/marketplace/transitions";
import { formatMoney } from "@/domains/marketplace/money";
import { COACH_RESPONSE_HOURS, DISPUTE_WINDOW_HOURS } from "@/domains/marketplace/policy";
import type { BookingSummary } from "@/domains/marketplace/types";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { MeterRow } from "@/domains/marketplace/components/hud/MeterRow";
import { StatusChip, type ChipTone } from "@/domains/marketplace/components/hud/StatusChip";

const LEGEND: { label: string; tone: ChipTone; body: string }[] = [
  {
    label: "Awaiting coach",
    tone: "warn",
    body: `Sent, not answered. Expires on its own after ${COACH_RESPONSE_HOURS} hours and the money goes back.`,
  },
  {
    label: "Confirmed",
    tone: "good",
    body: "Accepted and scheduled. Money is held, not paid out.",
  },
  {
    label: "Delivered",
    tone: "neutral",
    body: `Work is in. Settles on its own after ${DISPUTE_WINDOW_HOURS} hours unless challenged.`,
  },
  { label: "Completed", tone: "good", body: "Settled and released. A review can still be left." },
  { label: "Disputed", tone: "bad", body: "Read against the booking's own recorded history." },
];

interface Props {
  bookings: BookingSummary[];
  side: "student" | "coach";
}

/**
 * What is next, where the money is, and what the states mean.
 *
 * The money panel is derived from the booking statuses rather than from the
 * ledger: the two agree by construction (`holdsFunds` is what the ledger keys
 * off), and reading it here would cost a request per row.
 */
export function SessionsRail({ bookings, side }: Props): React.ReactElement {
  const currency = bookings[0]?.currency ?? "USD";
  const sum = (predicate: (b: BookingSummary) => boolean): number =>
    bookings.filter(predicate).reduce((total, b) => total + b.priceCents, 0);

  const held = sum((b) => holdsFunds(b.status) && b.status !== "DISPUTED");
  const frozen = sum((b) => b.status === "DISPUTED");
  const settled = sum((b) => b.status === "COMPLETED");
  const total = Math.max(1, held + frozen + settled);

  const next = bookings
    .filter((b) => b.status === "CONFIRMED" && b.startTime && new Date(b.startTime) > new Date())
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""))[0];

  return (
    <div className="grid gap-3.5">
      {next && (
        <HudPanel label="Next up" className="bg-hero-fade">
          <p className="font-mono text-[22px] font-bold leading-none text-text">
            {formatDateTime(next.startTime as string, {
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {next.listingTitle} &middot; {until(next.startTime as string)}
          </p>
          <p className="mt-3 text-[13px] text-text-body">
            Nothing streams through us — the coach supplies the room and you meet there (ADR-021).
          </p>
          <Link
            href={`/sessions/${next.id}`}
            className="mt-3.5 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-accent hover:text-acid-400"
          >
            Open the session &rarr;
          </Link>
        </HudPanel>
      )}

      <HudPanel label="Money in flight">
        <div className="grid gap-3">
          <MeterRow
            label="Held until settled"
            value={formatMoney(held, currency)}
            percent={(held / total) * 100}
            tone="muted"
            compact
          />
          <MeterRow
            label="Frozen · disputed"
            value={formatMoney(frozen, currency)}
            percent={(frozen / total) * 100}
            tone="info"
            compact
          />
          <MeterRow
            label={side === "coach" ? "Paid out" : "Settled"}
            value={formatMoney(settled, currency)}
            percent={(settled / total) * 100}
            compact
          />
        </div>
        <p className="mt-3.5 border-t border-line-1 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-warning">
          No payment provider connected — the ledger records what would have moved
        </p>
      </HudPanel>

      <HudPanel label="What the states mean">
        <dl className="grid gap-2.5">
          {LEGEND.map((item) => (
            <div key={item.label} className="grid grid-cols-[auto_1fr] items-start gap-2.5">
              <dt>
                <StatusChip tone={item.tone}>{item.label}</StatusChip>
              </dt>
              <dd className="text-[12.5px] text-text-muted">{item.body}</dd>
            </div>
          ))}
        </dl>
      </HudPanel>
    </div>
  );
}

/** "in 1d 8h", coarse on purpose. */
function until(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "now";
  const hours = Math.floor(ms / 3_600_000);
  const days = Math.floor(hours / 24);
  return days > 0 ? `in ${days}d ${hours % 24}h` : `in ${hours}h`;
}
