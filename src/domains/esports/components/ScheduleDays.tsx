"use client";

import { useEffect, useState } from "react";
import { MatchRow } from "@/domains/esports/components/MatchRow";
import { groupByDay } from "@/domains/esports/dayGroups";
import type { EsportsEvent } from "@/domains/esports/types";

interface ScheduleDaysProps {
  events: EsportsEvent[];
  /** Most recent day first — for results rather than fixtures. */
  descending?: boolean;
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
}: ScheduleDaysProps): React.ReactElement {
  const [groups, setGroups] = useState(() =>
    groupByDay(events, { zone: "utc", now: new Date(), descending })
  );

  useEffect(() => {
    setGroups(groupByDay(events, { zone: "local", now: new Date(), descending }));
  }, [events, descending]);

  return (
    <div className="grid gap-6">
      {groups.map((group) => (
        <section key={group.key}>
          <h3 className="sticky top-0 z-10 -mx-1 mb-2 bg-background/95 px-1 py-1.5 font-mono text-[11px] uppercase tracking-label text-text-body backdrop-blur">
            {group.label}
            <span className="ml-2 text-text-faint">{group.events.length}</span>
          </h3>
          <div className="grid gap-2">
            {group.events.map((event) => (
              <MatchRow
                key={event.matchId}
                event={event}
                href={`/esports/matches/${event.matchId}`}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
