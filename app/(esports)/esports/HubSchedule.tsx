"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MatchTime } from "@/domains/esports/components/MatchTime";
import { TeamBadge } from "@/domains/esports/components/TeamBadge";
import { groupByDay } from "@/domains/esports/dayGroups";
import type { EsportsEvent } from "@/domains/esports";

const ROW = "grid items-center gap-3.5 border-b border-line-1 px-4 py-2.5 last:border-b-0";
const ROW_COLUMNS = "76px minmax(96px,116px) minmax(0,1fr) 56px minmax(0,1fr)";

/**
 * The next fixtures, under day headings in the reader's own calendar days.
 *
 * The server groups in UTC so the first paint is deterministic, then this re-groups locally on
 * mount. Grouping in UTC alone would file a late-night match under tomorrow for readers west of it.
 */
export function HubSchedule({ events }: { events: EsportsEvent[] }): React.ReactElement {
  const [groups, setGroups] = useState(() => groupByDay(events, { zone: "utc", now: new Date() }));

  useEffect(() => {
    setGroups(groupByDay(events, { zone: "local", now: new Date() }));
  }, [events]);

  return (
    // `min-w-0` all the way down: a grid item defaults to min-width:auto, so without it the
    // scroll containers below refuse to shrink and widen the whole page instead.
    <div className="grid min-w-0 gap-4">
      {groups.map((group) => (
        <div key={group.key} className="min-w-0">
          <div className="flex items-center gap-3 border border-b-0 border-line-1 bg-surface-dark px-4 py-2">
            <span className="font-mono text-[10.5px] uppercase tracking-label text-text">
              {group.label}
            </span>
            <span className="ml-auto font-mono text-[10.5px] tracking-[0.14em] text-text-faint">
              {group.events.length} match{group.events.length === 1 ? "" : "es"}
            </span>
          </div>

          {/* Six columns will not fit a phone. Scrolling the block keeps the row readable
              instead of crushing the team names to two characters each. */}
          <div className="overflow-x-auto border border-line-1 bg-surface [&>a]:min-w-[620px]">
            {group.events.map((event) => {
              const [home, away] = event.teams;
              return (
                <Link
                  key={event.matchId}
                  href={`/esports/matches/${event.matchId}`}
                  className={`${ROW} border-l-2 border-l-transparent transition-colors hover:border-l-accent hover:bg-surface-2/60`}
                  style={{ gridTemplateColumns: ROW_COLUMNS }}
                >
                  <MatchTime
                    startTime={event.startTime}
                    className="font-mono text-sm tabular-nums text-text"
                  />
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate font-mono text-[10px] uppercase tracking-label text-text-body">
                      {event.league.name}
                    </span>
                    {event.blockName && (
                      <span className="truncate font-mono text-[9.5px] uppercase tracking-label text-text-faint">
                        {event.blockName}
                      </span>
                    )}
                  </span>
                  {home ? (
                    <TeamBadge team={home} align="right" />
                  ) : (
                    <span className="hud-label text-right">TBD</span>
                  )}
                  <span className="hud-label text-center text-[10.5px]">
                    {event.bestOf ? `Bo${event.bestOf}` : "vs"}
                  </span>
                  {away ? <TeamBadge team={away} /> : <span className="hud-label">TBD</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
