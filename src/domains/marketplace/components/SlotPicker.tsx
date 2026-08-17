"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
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
      <p className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text-muted">
        No free times in the next month. This coach may have their hours unset — try asking them.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-faint">
        Times are in your own timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).
      </p>

      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {byDay.map(([day, daySlots]) => (
          <div key={day} className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{day}</p>
            <div className="flex flex-wrap gap-1.5">
              {daySlots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => onSelect(slot.start)}
                  aria-pressed={selected === slot.start}
                  className={cn(
                    "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors",
                    selected === slot.start
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-surface-2 text-text-muted hover:text-text"
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
    const day = new Date(slot.start).toLocaleDateString(undefined, {
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
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
