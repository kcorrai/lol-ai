"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { BookingRow } from "@/domains/marketplace/components/BookingRow";
import type { BookingSummary } from "@/domains/marketplace/types";

type Filter = "All" | "Open" | "Confirmed" | "Delivered" | "Closed";

const MATCHES: Record<Filter, (status: BookingSummary["status"]) => boolean> = {
  All: () => true,
  Open: (s) => s === "PENDING_COACH",
  Confirmed: (s) => s === "CONFIRMED",
  Delivered: (s) => s === "DELIVERED" || s === "DISPUTED",
  Closed: (s) =>
    s === "COMPLETED" ||
    s === "DECLINED" ||
    s === "EXPIRED" ||
    s === "REFUNDED" ||
    s === "CANCELLED_BY_STUDENT" ||
    s === "CANCELLED_BY_COACH",
};

const FILTERS: Filter[] = ["All", "Open", "Confirmed", "Delivered", "Closed"];

interface Props {
  bookings: BookingSummary[];
  side: "student" | "coach";
  label: string;
  /** Shown when the coach or student has no bookings at all, filter aside. */
  empty: React.ReactNode;
}

/**
 * A filtered ledger of bookings, shared by the console and the sessions page.
 *
 * The filter is client state and nothing else — the whole list is already here,
 * so narrowing it must not cost a request, and a chip that spins is a chip
 * nobody uses twice.
 */
export function BookingList({ bookings, side, label, empty }: Props): React.ReactElement {
  const [filter, setFilter] = useState<Filter>("All");
  const shown = bookings.filter((b) => MATCHES[filter](b.status));

  return (
    <HudPanel
      label={label}
      padded={false}
      action={
        bookings.length > 0 && (
          <span className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "tag-cut shrink-0 border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-colors",
                  filter === f
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line-2 text-text-muted hover:text-text"
                )}
              >
                {f}
              </button>
            ))}
          </span>
        )
      }
    >
      {bookings.length === 0 ? (
        <div className="p-10 text-center">{empty}</div>
      ) : shown.length === 0 ? (
        <div className="p-10 text-center">
          <p className="font-display text-[15px] font-bold uppercase tracking-[0.04em] text-text">
            Nothing in this filter
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
            Try &ldquo;All&rdquo;
          </p>
        </div>
      ) : (
        shown.map((booking) => <BookingRow key={booking.id} booking={booking} side={side} />)
      )}
    </HudPanel>
  );
}
