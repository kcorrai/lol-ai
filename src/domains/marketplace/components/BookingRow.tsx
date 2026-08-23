"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatusChip, type ChipTone } from "@/domains/marketplace/components/hud/StatusChip";
import { formatMoney } from "@/domains/marketplace/money";
import type { BookingSummary } from "@/domains/marketplace/types";

interface Props {
  booking: BookingSummary;
  side: "student" | "coach";
}

/**
 * One booking in a list, on either side.
 *
 * A ledger line rather than a card: the two lists these appear in are read by
 * scanning one column at a time — what state is it in, when is it, what does it
 * want from me — and cards make that scan impossible.
 */
export function BookingRow({ booking, side }: Props): React.ReactElement {
  const status = statusMeta(booking.status);
  const action = actionHint(booking, side);

  return (
    <Link
      href={`/sessions/${booking.id}`}
      className={cn(
        "grid items-center gap-3.5 border-b border-line-1 px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2",
        "grid-cols-[110px_minmax(0,1fr)] md:grid-cols-[110px_minmax(0,1fr)_120px_70px_140px]",
        booking.status === "PENDING_COACH"
          ? "border-l-2 border-l-warning"
          : "border-l-2 border-l-transparent"
      )}
    >
      <StatusChip tone={status.tone} className="justify-center">
        {status.label}
      </StatusChip>

      <span className="grid min-w-0 gap-0.5">
        <span className="truncate text-sm text-text">{booking.listingTitle}</span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-text-faint">
          {side === "student" ? booking.coachDisplayName : booking.studentName}
        </span>
      </span>

      <span className="hidden text-right font-mono text-[11px] tracking-[0.1em] text-text-muted md:block">
        {booking.startTime ? whenLabel(booking.startTime) : "no fixed time"}
      </span>

      <span className="hidden text-right font-mono text-[13px] text-text md:block">
        {formatMoney(booking.priceCents, booking.currency)}
      </span>

      <span
        className={cn(
          "hidden text-right font-mono text-[9.5px] uppercase tracking-[0.14em] md:block",
          action.tone === "warn"
            ? "text-warning"
            : action.tone === "accent"
              ? "text-accent"
              : "text-text-faint"
        )}
      >
        {action.label}
      </span>
    </Link>
  );
}

/** How a status is written and coloured, wherever it is shown. */
export function statusMeta(status: BookingSummary["status"]): { label: string; tone: ChipTone } {
  switch (status) {
    case "PENDING_COACH":
      return { label: "Awaiting coach", tone: "warn" };
    case "CONFIRMED":
      return { label: "Confirmed", tone: "good" };
    case "DELIVERED":
      return { label: "Delivered", tone: "neutral" };
    case "COMPLETED":
      return { label: "Completed", tone: "good" };
    case "DISPUTED":
      return { label: "Disputed", tone: "bad" };
    case "REFUNDED":
      return { label: "Refunded", tone: "neutral" };
    case "EXPIRED":
      return { label: "Expired", tone: "neutral" };
    case "DECLINED":
      return { label: "Declined", tone: "bad" };
    default:
      return { label: "Cancelled", tone: "neutral" };
  }
}

export function StatusBadge({ status }: { status: BookingSummary["status"] }): React.ReactElement {
  const { label, tone } = statusMeta(status);
  return <StatusChip tone={tone}>{label}</StatusChip>;
}

/**
 * The one thing this row wants from the person reading it.
 *
 * Different per side on purpose — the same booking is "answer this" to a coach
 * and "waiting on them" to a student, and a shared wording would serve neither.
 */
function actionHint(
  booking: BookingSummary,
  side: "student" | "coach"
): { label: string; tone: "warn" | "accent" | "muted" } {
  if (booking.status === "PENDING_COACH") {
    return side === "coach"
      ? { label: `Answer by ${shortDay(booking.respondByAt)}`, tone: "warn" }
      : { label: `They have until ${shortDay(booking.respondByAt)}`, tone: "muted" };
  }
  if (booking.status === "CONFIRMED") {
    return { label: side === "coach" ? "Deliver it" : "Booked in", tone: "accent" };
  }
  if (booking.status === "DELIVERED") {
    return { label: side === "coach" ? "Settling" : "Confirm it happened", tone: "accent" };
  }
  if (booking.status === "COMPLETED") return { label: "Settled", tone: "muted" };
  if (booking.status === "DISPUTED") return { label: "With an admin", tone: "warn" };
  return { label: "Closed", tone: "muted" };
}

function shortDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", hour: "2-digit" });
}

/** Local to whoever is reading. The instant is fixed; the clock is theirs. */
export function whenLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
