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
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
        Nothing recorded yet
      </p>
    );
  }

  return (
    <ol>
      {history.map((event) => (
        <li
          key={event.id}
          className="ml-[3px] grid grid-cols-[16px_1fr] items-start gap-3 border-l border-line-1 py-2.5 pl-3"
        >
          <span
            aria-hidden
            className={`mt-1.5 h-[7px] w-[7px] ${accent(event) ? "bg-accent" : "bg-ink-400"}`}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span
                className={`font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] ${
                  accent(event) ? "text-accent" : "text-text"
                }`}
              >
                {label(event)}
              </span>
              <span className="font-mono text-[9px] tracking-[0.1em] text-text-faint">
                {whenLabel(event.createdAt)}
              </span>
            </div>

            {event.reason && <p className="mt-1 text-[12.5px] text-text-muted">{event.reason}</p>}

            <p className="mt-1 text-[12.5px] text-text-muted">
              {/* No actor means a scheduled sweep did it, and saying so is more
                  honest than attributing it to whoever happens to be reading. */}
              {event.actor ? (event.actor.name ?? "Someone") : "Automatically"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Whether this move was a good one — the spine reads at a glance that way. */
function accent(event: BookingEventRow): boolean {
  return (
    event.toStatus === "CONFIRMED" ||
    event.toStatus === "DELIVERED" ||
    event.toStatus === "COMPLETED"
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
