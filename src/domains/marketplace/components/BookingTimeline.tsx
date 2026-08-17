"use client";

import type { BookingEventRow } from "@/domains/marketplace/types";
import { whenLabel } from "@/domains/marketplace/components/BookingRow";

interface Props {
  history: BookingEventRow[];
}

/**
 * Every move this booking has made, with who made it and why.
 *
 * Shown to both sides on purpose. The single most common complaint about every
 * competing platform is a session that was paid for and never delivered,
 * followed by a refusal nobody can reconstruct — a dispute here is settled
 * against a record both people have been able to read the whole time.
 */
export function BookingTimeline({ history }: Props): React.ReactElement {
  if (history.length === 0) {
    return <p className="text-xs text-text-faint">Nothing recorded yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {history.map((event) => (
        <li key={event.id} className="border-l border-border pl-3">
          <p className="text-sm text-text">
            {label(event)}
            <span className="ml-2 font-mono text-[11px] text-text-faint">
              {whenLabel(event.createdAt)}
            </span>
          </p>

          {event.reason && <p className="mt-0.5 text-xs text-text-muted">{event.reason}</p>}

          <p className="mt-0.5 text-[11px] text-text-faint">
            {/* No actor means a scheduled sweep did it, and saying so is more
                honest than attributing it to whoever happens to be reading. */}
            {event.actor ? (event.actor.name ?? "Someone") : "Automatically"}
          </p>
        </li>
      ))}
    </ol>
  );
}

function label(event: BookingEventRow): string {
  if (!event.fromStatus) return "Requested";

  switch (event.toStatus) {
    case "CONFIRMED":
      return "Accepted";
    case "DECLINED":
      return "Declined";
    case "EXPIRED":
      return "Expired";
    case "CANCELLED_BY_STUDENT":
      return "Cancelled by the student";
    case "CANCELLED_BY_COACH":
      return "Cancelled by the coach";
    case "DELIVERED":
      return "Delivered";
    case "COMPLETED":
      return "Completed";
    case "DISPUTED":
      return "Challenged";
    case "REFUNDED":
      return "Refunded";
    default:
      return event.toStatus;
  }
}
