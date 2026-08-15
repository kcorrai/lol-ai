import Link from "next/link";
import { MatchTime } from "@/domains/esports/components/MatchTime";
import { TeamBadge } from "@/domains/esports/components/TeamBadge";
import type { EsportsEvent } from "@/domains/esports/types";

interface MatchRowProps {
  event: EsportsEvent;
  /**
   * Where the row links. Left undefined until match pages exist (TASK-303) —
   * a row that navigates nowhere is better than one that 404s.
   */
  href?: string;
  /** Hidden on pages that are already scoped to one league. */
  showLeague?: boolean;
  /** Include the day with the kickoff time, for lists spanning several days. */
  withDate?: boolean;
}

function Score({ event }: { event: EsportsEvent }): React.ReactElement {
  const [home, away] = event.teams;

  if (event.state === "unstarted") {
    return (
      <span className="hud-label whitespace-nowrap">
        {event.bestOf ? `Bo${event.bestOf}` : "vs"}
      </span>
    );
  }

  return (
    <span className="whitespace-nowrap font-mono text-base font-bold text-text">
      {home?.gameWins ?? 0}
      <span className="mx-1 text-text-faint">–</span>
      {away?.gameWins ?? 0}
    </span>
  );
}

function StateLabel({
  event,
  withDate,
}: {
  event: EsportsEvent;
  withDate: boolean;
}): React.ReactElement {
  if (event.state === "inProgress") {
    // The one place on the page the accent is spent: something is happening now.
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-label text-accent">
        <span
          className="h-1.5 w-1.5 rounded-full bg-accent motion-safe:animate-pulse"
          aria-hidden
        />
        Live
      </span>
    );
  }
  if (event.state === "completed") {
    return <span className="hud-label">Final</span>;
  }
  return (
    <MatchTime
      startTime={event.startTime}
      withDate={withDate}
      className="font-mono text-[11px] leading-tight text-text-body"
    />
  );
}

/**
 * One series: both teams, the score or format, and where it is in time. Used by
 * the hub, the schedule and the league pages, so it carries no page-specific
 * layout of its own.
 *
 * The layout is a grid rather than nested flex rows so that phones can put the
 * league and the kickoff on their own line above the teams while wider screens
 * keep all three in one row — with each piece rendered exactly once, not
 * duplicated behind two sets of responsive visibility classes.
 */
export function MatchRow({
  event,
  href,
  showLeague = true,
  withDate = false,
}: MatchRowProps): React.ReactElement {
  const [home, away] = event.teams;
  const decided = event.state === "completed";

  const body = (
    <>
      {showLeague && (
        <div className="order-1 min-w-0 sm:w-32">
          <p className="truncate font-mono text-[11px] uppercase tracking-label text-text-body">
            {event.league.name}
          </p>
          {event.blockName && (
            <p className="truncate text-[11px] text-text-faint">{event.blockName}</p>
          )}
        </div>
      )}

      <div className="order-3 col-span-2 grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-2 sm:order-2 sm:col-span-1">
        {home ? (
          <TeamBadge team={home} muted={decided && home.outcome === "loss"} />
        ) : (
          <span className="hud-label">TBD</span>
        )}
        <Score event={event} />
        {away ? (
          <TeamBadge team={away} align="right" muted={decided && away.outcome === "loss"} />
        ) : (
          <span className="hud-label text-right">TBD</span>
        )}
      </div>

      <div className="order-2 justify-self-end text-right sm:order-3 sm:w-24">
        <StateLabel event={event} withDate={withDate} />
      </div>
    </>
  );

  const className = [
    "gaming-card notch-sm grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-3 py-2.5",
    "transition-colors hover:border-line-2",
    showLeague ? "sm:grid-cols-[8rem_1fr_6rem]" : "sm:grid-cols-[1fr_6rem]",
  ].join(" ");

  if (!href) return <article className={className}>{body}</article>;

  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
