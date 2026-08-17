"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { BookingSummary } from "@/domains/marketplace/types";
import { kindLabel } from "@/domains/marketplace/components/options";

interface Props {
  booking: BookingSummary;
  side: "student" | "coach";
}

/** One booking in a list, on either side. */
export function BookingRow({ booking, side }: Props): React.ReactElement {
  return (
    <Link
      href={`/sessions/${booking.id}`}
      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/40"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-text">{booking.listingTitle}</p>
          <Badge variant="secondary">{kindLabel(booking.kind)}</Badge>
          <StatusBadge status={booking.status} />
        </div>

        <p className="mt-1 text-xs text-text-muted">
          {side === "student" ? `with ${booking.coachDisplayName}` : `for ${booking.studentName}`}
          {" · "}
          {booking.startTime ? whenLabel(booking.startTime) : "no fixed time"}
        </p>

        {booking.status === "PENDING_COACH" && (
          <p className="mt-1 text-xs text-warning">
            {side === "coach" ? "Answer by " : "The coach has until "}
            {whenLabel(booking.respondByAt)}
          </p>
        )}
      </div>

      <p className="shrink-0 font-mono text-sm text-text">
        {new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: booking.currency,
        }).format(booking.priceCents / 100)}
      </p>
    </Link>
  );
}

export function StatusBadge({ status }: { status: BookingSummary["status"] }): React.ReactElement {
  switch (status) {
    case "PENDING_COACH":
      return <Badge variant="warning">Waiting on the coach</Badge>;
    case "CONFIRMED":
      return <Badge variant="success">Confirmed</Badge>;
    case "DELIVERED":
      return <Badge variant="secondary">Delivered</Badge>;
    case "COMPLETED":
      return <Badge variant="success">Completed</Badge>;
    case "DISPUTED":
      return <Badge variant="destructive">Disputed</Badge>;
    case "REFUNDED":
      return <Badge variant="outline">Refunded</Badge>;
    case "EXPIRED":
      return <Badge variant="outline">Expired</Badge>;
    case "DECLINED":
      return <Badge variant="destructive">Declined</Badge>;
    default:
      return <Badge variant="outline">Cancelled</Badge>;
  }
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
