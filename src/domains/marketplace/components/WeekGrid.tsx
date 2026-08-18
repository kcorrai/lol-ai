"use client";

import { cn } from "@/lib/utils";
import { cellKey, type CellKey } from "@/domains/marketplace/availabilityGrid";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  open: Set<CellKey>;
  /** Hours already taken by a confirmed booking. Not clickable — see below. */
  booked: Set<CellKey>;
  onToggle: (day: number, hour: number) => void;
  /** Narrows the rows to the band a coach actually works in. */
  fromHour?: number;
  toHour?: number;
}

/**
 * The week as a grid of hours you click to open or close.
 *
 * A booked hour is drawn solid and refuses the click. Closing an hour somebody
 * has already been sold is not an edit, it is a cancellation, and that has to
 * go through the booking rather than through a calendar cell.
 */
export function WeekGrid({
  open,
  booked,
  onToggle,
  fromHour = 8,
  toHour = 23,
}: Props): React.ReactElement {
  const hours = Array.from({ length: toHour - fromHour + 1 }, (_, i) => fromHour + i);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[660px]">
        <div className="mb-1.5 grid grid-cols-[58px_repeat(7,1fr)] gap-1">
          <span />
          {DAY_LABELS.map((label) => (
            <span
              key={label}
              className="text-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-text-muted"
            >
              {label}
            </span>
          ))}
        </div>

        {hours.map((hour) => (
          <div key={hour} className="mb-1 grid grid-cols-[58px_repeat(7,1fr)] gap-1">
            <span className="self-center font-mono text-[10.5px] text-text-faint">
              {String(hour).padStart(2, "0")}:00
            </span>
            {DAY_LABELS.map((label, day) => {
              const key = cellKey(day, hour);
              const isBooked = booked.has(key);
              const isOpen = open.has(key);

              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isOpen}
                  disabled={isBooked}
                  title={`${label} ${String(hour).padStart(2, "0")}:00 · ${
                    isBooked ? "booked" : isOpen ? "open" : "closed"
                  }`}
                  onClick={() => onToggle(day, hour)}
                  className={cn(
                    "h-[26px] border transition-colors",
                    isBooked
                      ? "glow-accent-soft cursor-not-allowed border-accent bg-accent"
                      : isOpen
                        ? "border-accent/40 bg-accent/20 hover:bg-accent/30"
                        : "border-line-1 bg-surface-dark hover:border-line-3"
                  )}
                >
                  <span className="sr-only">
                    {label} {hour}:00 {isBooked ? "booked" : isOpen ? "open" : "closed"}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeekGridLegend(): React.ReactElement {
  return (
    <span className="flex flex-wrap items-center gap-3.5">
      {[
        { label: "Open", className: "border-accent/40 bg-accent/20" },
        { label: "Booked", className: "border-accent bg-accent" },
        { label: "Closed", className: "border-line-1 bg-surface-dark" },
      ].map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint"
        >
          <span className={cn("h-[11px] w-[11px] border", item.className)} aria-hidden />
          {item.label}
        </span>
      ))}
    </span>
  );
}
