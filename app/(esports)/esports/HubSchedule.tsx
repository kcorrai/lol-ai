"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MatchTime } from "@/domains/esports/components/MatchTime";
import { TeamBadge } from "@/domains/esports/components/TeamBadge";
import { groupByDay, zoneFor } from "@/domains/esports/dayGroups";
import { useEsportsPrefsStore } from "@/lib/stores/esportsPrefsStore";
import type { EsportsEvent } from "@/domains/esports";

/**
 * Five columns on a wide screen; on a phone, kickoff and league on one line and
 * the fixture under them. The fixed 620px row this replaces scrolled the away
 * team off a phone's screen.
 */
const ROW =
  "grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-x-3.5 gap-y-2 border-b border-line-1 px-4 py-2.5 last:border-b-0 sm:grid-cols-[76px_minmax(96px,116px)_minmax(0,1fr)_56px_minmax(0,1fr)]";

/**
 * The next fixtures, under day headings in the reader's own calendar days.
 *
 * The server groups in UTC so the first paint is deterministic, then this re-groups locally on
 * mount. Grouping in UTC alone would file a late-night match under tomorrow for readers west of it.
 */
export function HubSchedule({ events }: { events: EsportsEvent[] }): React.ReactElement {
  const timeZone = useEsportsPrefsStore((state) => state.timeZone);
  const [groups, setGroups] = useState(() => groupByDay(events, { zone: "utc", now: new Date() }));

  useEffect(() => {
    setGroups(groupByDay(events, { zone: zoneFor(timeZone), now: new Date() }));
  }, [events, timeZone]);

  return (
    // `min-w-0` all the way down: a grid item defaults to min-width:auto, so without it the
    // scroll containers below refuse to shrink and widen the whole page instead.
    <div className="grid min-w-0 gap-4">
      {groups.map((group) => (
        <div key={group.key} className="min-w-0">
          <div className="flex items-center gap-3 border border-b-0 border-line-1 bg-surface-dark px-4 py-2">
            <span className="font-mono text-[11px] uppercase tracking-label text-text">
              {group.label}
            </span>
            <span className="ml-auto font-mono text-[11px] tracking-[0.14em] text-text-faint">
              {group.events.length} match{group.events.length === 1 ? "" : "es"}
            </span>
          </div>

          <div className="border border-line-1 bg-surface">
            {group.events.map((event) => {
              const [home, away] = event.teams;
              return (
                <Link
                  key={event.matchId}
                  href={`/esports/matches/${event.matchId}`}
                  className={`${ROW} border-l-2 border-l-transparent transition-colors hover:border-l-accent hover:bg-surface-2/60`}
                >
                  <MatchTime
                    startTime={event.startTime}
                    className="font-mono text-sm tabular-nums text-text"
                  />
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate font-mono text-[11px] uppercase tracking-label text-text-body">
                      {event.league.name}
                    </span>
                    {event.blockName && (
                      <span className="truncate font-mono text-[11px] uppercase tracking-label text-text-faint">
                        {event.blockName}
                      </span>
                    )}
                  </span>
                  <span className="col-span-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3.5 sm:contents">
                    {home ? (
                      <TeamBadge team={home} align="right" />
                    ) : (
                      <span className="hud-label text-right">TBD</span>
                    )}
                    <span className="hud-label text-center text-[11px]">
                      {event.bestOf ? `Bo${event.bestOf}` : "vs"}
                    </span>
                    {away ? <TeamBadge team={away} /> : <span className="hud-label">TBD</span>}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
