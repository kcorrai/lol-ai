"use client";

import { cn } from "@/lib/utils";
import type { BookingDetail, BookingEventRow } from "@/domains/marketplace/types";
import { whenLabel } from "@/domains/marketplace/components/BookingRow";

interface Props {
  booking: BookingDetail;
  history: BookingEventRow[];
}

/**
 * The four stages of a booking, and which of them have actually happened.
 *
 * Read off the recorded events rather than inferred from the current status: a
 * cancelled booking really did get accepted first, and a rail that hid that
 * would disagree with the history panel three inches below it.
 */
export function SessionProgress({ booking, history }: Props): React.ReactElement {
  const at = (predicate: (event: BookingEventRow) => boolean): string | null => {
    const event = history.find(predicate);
    return event ? whenLabel(event.createdAt) : null;
  };

  const requested = at((e) => e.fromStatus === null) ?? whenLabel(booking.createdAt);
  const accepted = at((e) => e.toStatus === "CONFIRMED");
  const delivered = booking.deliveredAt ? whenLabel(booking.deliveredAt) : null;
  const ended = at(
    (e) =>
      e.toStatus === "COMPLETED" ||
      e.toStatus === "DISPUTED" ||
      e.toStatus === "REFUNDED" ||
      e.toStatus === "DECLINED" ||
      e.toStatus === "EXPIRED" ||
      e.toStatus === "CANCELLED_BY_COACH" ||
      e.toStatus === "CANCELLED_BY_STUDENT"
  );

  const steps = [
    { label: "Requested", at: requested, done: true, bad: false },
    { label: "Accepted", at: accepted ?? "not yet", done: accepted !== null, bad: false },
    { label: "Delivered", at: delivered ?? "not yet", done: delivered !== null, bad: false },
    {
      label: endLabel(booking.status),
      at: ended ?? (booking.autoCompleteAt ? whenLabel(booking.autoCompleteAt) : "not yet"),
      done: ended !== null,
      bad: booking.status === "DISPUTED" || booking.status === "REFUNDED",
    },
  ];

  return (
    <div className="mt-5 grid gap-px border border-border bg-line-1 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step) => (
        <div key={step.label} className="bg-background px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={cn(
                "h-[7px] w-[7px] shrink-0",
                step.done
                  ? step.bad
                    ? "bg-danger"
                    : "glow-accent-soft bg-accent"
                  : "border border-line-2"
              )}
            />
            <span
              className={cn(
                "font-mono text-[9px] uppercase tracking-[0.18em]",
                step.done ? (step.bad ? "text-danger" : "text-accent") : "text-text-faint"
              )}
            >
              {step.label}
            </span>
          </div>
          <p className="mt-2 font-mono text-[11px] text-text-muted">{step.at}</p>
        </div>
      ))}
    </div>
  );
}

/** What the fourth stage is called, which depends on how it ended. */
function endLabel(status: BookingDetail["status"]): string {
  switch (status) {
    case "DISPUTED":
      return "Disputed";
    case "REFUNDED":
      return "Refunded";
    case "DECLINED":
      return "Declined";
    case "EXPIRED":
      return "Expired";
    case "CANCELLED_BY_COACH":
    case "CANCELLED_BY_STUDENT":
      return "Cancelled";
    default:
      return "Settled";
  }
}
