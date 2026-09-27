import Link from "next/link";
import { MatchTime } from "@/domains/esports/components/MatchTime";
import { TeamBadge } from "@/domains/esports/components/TeamBadge";
import type { EsportsEvent } from "@/domains/esports";

/**
 * Five columns on a wide screen. On a phone the row folds in two — league and
 * date with the link on top, the teams and score underneath — because five
 * columns crushed to phone width, or scrolled sideways, hid the away team.
 */
const ROW =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2 border-b border-line-1 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2/60 sm:grid-cols-[minmax(96px,116px)_minmax(0,1fr)_92px_minmax(0,1fr)_96px]";

/** Finished series, most recent first. */
export function HubResults({ events }: { events: EsportsEvent[] }): React.ReactElement {
  return (
    <div className="notch border border-border bg-surface">
      {events.map((event) => {
        const [home, away] = event.teams;
        return (
          <Link
            key={event.matchId}
            href={`/esports/matches/${event.matchId}`}
            className={ROW}
            data-spoiler-scope=""
          >
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate font-mono text-[11px] uppercase tracking-label text-text-body">
                {event.league.name}
              </span>
              <MatchTime
                startTime={event.startTime}
                withDate
                className="font-mono text-[11px] uppercase tracking-label text-text-faint [&>span]:inline [&>span]:after:content-['_']"
              />
            </span>
            <span className="order-3 col-span-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3.5 sm:contents">
              {home ? (
                <TeamBadge team={home} align="right" muted={home.outcome === "loss"} />
              ) : (
                <span className="hud-label text-right">TBD</span>
              )}
              <span
                className="text-center font-mono text-base font-bold tabular-nums text-text"
                data-spoiler=""
              >
                {home?.gameWins ?? 0}
                <span className="mx-1.5 text-text-faint">–</span>
                {away?.gameWins ?? 0}
              </span>
              {away ? (
                <TeamBadge team={away} muted={away.outcome === "loss"} />
              ) : (
                <span className="hud-label">TBD</span>
              )}
            </span>
            <span className="order-2 text-right font-mono text-[11px] uppercase tracking-label text-accent sm:order-none">
              {/* A recorded series says so, since watching it is the other
                  reason to open a result. */}
              {event.hasVod ? "Draft · VOD →" : "Draft →"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
