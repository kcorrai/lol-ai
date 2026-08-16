"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TeamBadge } from "@/domains/esports/components/TeamBadge";
import { useLiveEsports } from "@/hooks/useLiveEsports";
import { streamLinks } from "@/domains/esports/watch";
import type { EsportsEvent } from "@/domains/esports";

/**
 * The live board, polled while anything is on.
 *
 * The server passes what it already had and that is what ends up in the HTML, so a crawler and a
 * reader on a slow connection both see the scoreboard without waiting for JavaScript.
 */
export function HubLive({
  initialEvents,
}: {
  initialEvents: EsportsEvent[];
}): React.ReactElement | null {
  const { data, isFetching, isError } = useLiveEsports(initialEvents);
  const events = data?.events ?? initialEvents;

  if (events.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="h-1.5 w-1.5 bg-danger motion-safe:animate-pulse" aria-hidden />
        <span className="font-mono text-[11px] uppercase tracking-label text-text">Live now</span>
        <span className="h-px flex-1 bg-line-1" />
        <span className="hud-label text-[10.5px]">
          {events.length} in progress
          {/* A failed poll keeps the last scoreboard on screen and says so, rather than
              clearing it or pretending it is current. */}
          {isError ? " · reconnecting" : isFetching ? " · updating" : ""}
        </span>
      </div>

      <div className="grid gap-3.5 xl:grid-cols-2">
        {events.map((event) => {
          const [home, away] = event.teams;
          // English first, which is what `streamLinks` already orders by. The
          // feed publishes these only on the live endpoint, so they exist here
          // and nowhere else on the hub.
          const [broadcast] = streamLinks(event.streams);

          return (
            <article
              key={event.matchId}
              className="notch border border-danger/70 bg-surface shadow-[0_0_30px_rgba(255,90,90,0.10)] transition-colors hover:border-danger"
            >
              <Link href={`/esports/matches/${event.matchId}`} className="block">
                <div className="flex items-center justify-between gap-3 border-b border-line-1 bg-surface-2 px-4 py-2.5">
                  <span className="hud-label truncate text-[10.5px] text-text-body">
                    {event.league.name}
                    {event.blockName ? ` · ${event.blockName}` : ""}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-label text-danger">
                    <span className="h-1.5 w-1.5 bg-danger motion-safe:animate-pulse" aria-hidden />
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-5">
                  {home ? <TeamBadge team={home} /> : <span className="hud-label">TBD</span>}
                  <div className="text-center">
                    <div className="font-mono text-[30px] font-bold tabular-nums leading-none text-text">
                      {home?.gameWins ?? 0}
                      <span className="mx-2 text-text-faint">–</span>
                      {away?.gameWins ?? 0}
                    </div>
                    {event.bestOf && (
                      <div className="hud-label mt-1.5 text-[10px]">Bo{event.bestOf}</div>
                    )}
                  </div>
                  {away ? (
                    <TeamBadge team={away} align="right" />
                  ) : (
                    <span className="hud-label text-right">TBD</span>
                  )}
                </div>
              </Link>

              {/* The card stops being one link here on purpose: an anchor
                  cannot nest inside another, and a live match wants two
                  destinations — the broadcast, and our own page for it. */}
              <div className="flex items-center justify-between gap-3 border-t border-line-1 px-4 py-2.5">
                {broadcast ? (
                  <a
                    href={broadcast.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-label text-text-body transition-colors hover:text-accent"
                  >
                    Watch on {broadcast.provider === "twitch" ? "Twitch" : "YouTube"}
                    <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="hud-label text-[10.5px]">Draft, builds and per-game stats</span>
                )}
                <Link
                  href={`/esports/matches/${event.matchId}`}
                  className="flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-label text-accent"
                >
                  Open match
                  <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
