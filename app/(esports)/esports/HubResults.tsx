import Link from "next/link";
import { MatchTime } from "@/domains/esports/components/MatchTime";
import { TeamBadge } from "@/domains/esports/components/TeamBadge";
import type { EsportsEvent } from "@/domains/esports";

const ROW_COLUMNS = "minmax(96px,116px) minmax(0,1fr) 92px minmax(0,1fr) 96px";

/** Finished series, most recent first. */
export function HubResults({ events }: { events: EsportsEvent[] }): React.ReactElement {
  return (
    // Five columns will not fit a phone; scrolling beats crushing the team names.
    <div className="notch overflow-x-auto border border-border bg-surface [&>a]:min-w-[600px]">
      {events.map((event) => {
        const [home, away] = event.teams;
        return (
          <Link
            key={event.matchId}
            href={`/esports/matches/${event.matchId}`}
            className="grid items-center gap-3.5 border-b border-line-1 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2/60"
            style={{ gridTemplateColumns: ROW_COLUMNS }}
          >
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate font-mono text-[10px] uppercase tracking-label text-text-body">
                {event.league.name}
              </span>
              <MatchTime
                startTime={event.startTime}
                withDate
                className="font-mono text-[9.5px] uppercase tracking-label text-text-faint [&>span]:inline [&>span]:after:content-['_']"
              />
            </span>
            {home ? (
              <TeamBadge team={home} align="right" muted={home.outcome === "loss"} />
            ) : (
              <span className="hud-label text-right">TBD</span>
            )}
            <span className="text-center font-mono text-base font-bold tabular-nums text-text">
              {home?.gameWins ?? 0}
              <span className="mx-1.5 text-text-faint">–</span>
              {away?.gameWins ?? 0}
            </span>
            {away ? (
              <TeamBadge team={away} muted={away.outcome === "loss"} />
            ) : (
              <span className="hud-label">TBD</span>
            )}
            <span className="text-right font-mono text-[10px] uppercase tracking-label text-accent">
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
