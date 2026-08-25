"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/uiLocale";
import { Skeleton } from "@/components/ui/skeleton";
import type { Slot } from "@/domains/marketplace/types";

interface Props {
  slots: Slot[];
  loading: boolean;
  selected: string | null;
  onSelect: (start: string) => void;
}

/**
 * Choosing a time.
 *
 * Everything is rendered in the **student's** timezone, because that is the
 * clock they will actually turn up on. The coach's hours were written in the
 * coach's zone and resolved on the server; by the time a slot reaches here it
 * is an instant, and an instant has no timezone left to get wrong.
 */
export function SlotPicker({ slots, loading, selected, onSelect }: Props): React.ReactElement {
  const byDay = useMemo(() => groupByDay(slots), [slots]);

  if (loading) return <Skeleton className="h-28 w-full" />;

  if (slots.length === 0) {
    return (
      <p className="border border-line-2 bg-surface-dark px-3 py-2 text-sm text-text-muted">
        No free times in the next month. This coach may have their hours unset — try asking them.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {byDay.map(([day, daySlots]) => (
          <div key={day}>
            <div className="mb-1.5 flex items-center gap-2.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-body">
                {day}
              </span>
              <span className="h-px flex-1 bg-line-1" aria-hidden />
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
                {daySlots.length} open
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {daySlots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => onSelect(slot.start)}
                  aria-pressed={selected === slot.start}
                  className={cn(
                    "tag-cut border px-2.5 py-1.5 font-mono text-[11.5px] tracking-[0.06em] transition-colors",
                    selected === slot.start
                      ? "glow-accent-soft border-accent bg-accent text-background"
                      : "border-line-2 bg-surface-dark text-text-muted hover:border-accent hover:text-text"
                  )}
                >
                  {timeLabel(slot.start)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByDay(slots: Slot[]): [string, Slot[]][] {
  const groups = new Map<string, Slot[]>();

  for (const slot of slots) {
    const day = formatDate(slot.start, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const list = groups.get(day);
    if (list) list.push(slot);
    else groups.set(day, [slot]);
  }

  return [...groups.entries()];
}

function timeLabel(iso: string): string {
  return formatTime(iso, { hour: "2-digit", minute: "2-digit" });
}
