"use client";

import { useLiveEsports } from "@/hooks/useLiveEsports";
import { MatchRow } from "@/domains/esports/components/MatchRow";
import type { EsportsEvent } from "@/domains/esports/types";

/**
 * The live block, upgraded from a static render to a polling one.
 *
 * The server passes what it already had, and that is what ends up in the HTML —
 * so a crawler and a reader on a slow connection both see the live matches
 * without waiting for JavaScript, and there is no layout shift when the hook
 * takes over.
 */
export function LiveMatches({
  initialEvents,
}: {
  initialEvents: EsportsEvent[];
}): React.ReactElement | null {
  const { data, isFetching, isError } = useLiveEsports(initialEvents);
  const events = data?.events ?? initialEvents;

  if (events.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
          Live now
        </h2>
        <span className="hud-label">
          {events.length} in progress
          {/* A failed poll keeps the last scoreboard on screen and says so,
              rather than clearing it or pretending it is current. */}
          {isError ? " · reconnecting" : isFetching ? " · updating" : ""}
        </span>
      </div>
      <div className="grid gap-2">
        {events.map((event) => (
          <MatchRow
            key={event.matchId}
            event={event}
            href={`/esports/matches/${event.matchId}`}
            withDate
          />
        ))}
      </div>
    </div>
  );
}
