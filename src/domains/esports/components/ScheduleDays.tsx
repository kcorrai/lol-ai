"use client";

import { useEffect, useState } from "react";
import { SeriesRow } from "@/domains/esports/components/SeriesRow";
import { groupByDay } from "@/domains/esports/dayGroups";
import type { EsportsEvent } from "@/domains/esports/types";

interface ScheduleDaysProps {
  events: EsportsEvent[];
  /** Most recent day first — for results rather than fixtures. */
  descending?: boolean;
  /** Puts the accent rail on the very first fixture. Off for results. */
  highlightNext?: boolean;
}

/**
 * "18 Aug · Tue", from a YYYY-MM-DD group key.
 *
 * Parsed and formatted in UTC on both sides of hydration: the key names a
 * calendar day, not an instant, so shifting it into the reader's zone would move
 * the caption a day away from the heading it sits next to.
 */
function calendarDate(key: string): string {
  const date = new Date(`${key}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  return `${day} · ${weekday}`;
}

/**
 * Matches under day headings, in the reader's own calendar days.
 *
 * The server groups in UTC so the first paint is deterministic, then this
 * re-groups locally on mount. Grouping in UTC alone would file a late-night
 * match under tomorrow for readers west of it — and formatting the local day
 * during render instead would produce markup the server cannot match.
 */
export function ScheduleDays({
  events,
  descending = false,
  highlightNext = false,
}: ScheduleDaysProps): React.ReactElement {
  const [groups, setGroups] = useState(() =>
    groupByDay(events, { zone: "utc", now: new Date(), descending })
  );

  useEffect(() => {
    setGroups(groupByDay(events, { zone: "local", now: new Date(), descending }));
  }, [events, descending]);

  return (
    <div className="grid gap-5">
      {groups.map((group, groupIndex) => (
        <section key={group.key}>
          <h3 className="sticky top-[var(--esports-sticky-top,0px)] z-30 flex items-center gap-3 border border-border bg-[var(--surface-glass)] px-4 py-2.5 backdrop-blur-[14px]">
            <span
              className={`shrink-0 font-display text-[15px] font-extrabold uppercase tracking-[0.08em] ${
                group.label === "Today" ? "text-accent" : "text-text"
              }`}
            >
              {group.label}
            </span>
            <span className="hud-label hidden shrink-0 sm:inline">{calendarDate(group.key)}</span>
            <span className="h-px flex-1 bg-line-1" aria-hidden />
            <span className="hud-label shrink-0">{group.events.length} series</span>
          </h3>
          <div className="border border-t-0 border-border bg-surface">
            {group.events.map((event, index) => (
              <SeriesRow
                key={event.matchId}
                event={event}
                href={`/esports/matches/${event.matchId}`}
                highlight={highlightNext && groupIndex === 0 && index === 0}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
