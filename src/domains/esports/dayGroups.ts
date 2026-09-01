import type { EsportsEvent } from "@/domains/esports/types";
import { formatDate } from "@/lib/uiLocale";

export type DayZone = "utc" | "local";

export interface DayGroup {
  /** YYYY-MM-DD in the chosen zone. Stable enough to use as a React key. */
  key: string;
  /** "Today", "Tomorrow", "Yesterday", or "Sat 16 Aug". */
  label: string;
  events: EsportsEvent[];
}

function dayKey(date: Date, zone: DayZone): string {
  if (zone === "utc") return date.toISOString().slice(0, 10);
  // Local: build the key from local parts rather than shifting the instant, so
  // it lands on the same calendar day the reader would say it is.
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayLabel(date: Date, zone: DayZone, now: Date): string {
  const key = dayKey(date, zone);
  const today = dayKey(now, zone);

  const oneDay = 24 * 60 * 60 * 1000;
  if (key === today) return "Today";
  if (key === dayKey(new Date(now.getTime() + oneDay), zone)) return "Tomorrow";
  if (key === dayKey(new Date(now.getTime() - oneDay), zone)) return "Yesterday";

  // One locale for both branches. The UTC one used to say "en-GB" and the local one nothing
  // at all — so the server's first paint and the client's re-group after mount formatted the
  // same day two different ways, and which one you saw depended on the reader's machine.
  return formatDate(date, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(zone === "utc" ? { timeZone: "UTC" } : {}),
  });
}

/**
 * Groups matches into calendar days.
 *
 * The zone matters: grouping in UTC files a match under the wrong day for any
 * reader far enough east or west of it. The server has no way to know the
 * reader's zone, so it groups in UTC for the first paint and the client
 * re-groups locally after mount — which is also why `now` is a parameter rather
 * than read from the clock inside.
 */
export function groupByDay(
  events: EsportsEvent[],
  { zone, now, descending = false }: { zone: DayZone; now: Date; descending?: boolean }
): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const event of events) {
    const date = new Date(event.startTime);
    if (Number.isNaN(date.getTime())) continue;

    const key = dayKey(date, zone);
    const existing = groups.get(key);
    if (existing) {
      existing.events.push(event);
    } else {
      groups.set(key, { key, label: dayLabel(date, zone, now), events: [event] });
    }
  }

  const ordered = [...groups.values()].sort((a, b) =>
    descending ? b.key.localeCompare(a.key) : a.key.localeCompare(b.key)
  );

  for (const group of ordered) {
    group.events.sort((a, b) =>
      descending ? b.startTime.localeCompare(a.startTime) : a.startTime.localeCompare(b.startTime)
    );
  }

  return ordered;
}

/** Events starting within `days` of `now`, inclusive of anything already live. */
export function withinDays(events: EsportsEvent[], days: number, now: Date): EsportsEvent[] {
  const horizon = now.getTime() + days * 24 * 60 * 60 * 1000;
  return events.filter((event) => {
    const at = new Date(event.startTime).getTime();
    return !Number.isNaN(at) && at <= horizon;
  });
}
