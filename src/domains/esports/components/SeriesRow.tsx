import Link from "next/link";
import { MatchTime } from "@/domains/esports/components/MatchTime";
import { TeamCrest } from "@/domains/esports/components/TeamCrest";
import type { EsportsEvent, EsportsEventTeam, MatchOutcome } from "@/domains/esports/types";

interface SeriesRowProps {
  event: EsportsEvent;
  href?: string;
  /** Hidden on pages already scoped to one league. */
  showLeague?: boolean;
  /** Include the day with the kickoff, for lists spanning several days. */
  withDate?: boolean;
  /** Result from one team's point of view — prints WIN/LOSS and tints the rail. */
  outcome?: MatchOutcome | null;
  /** The accent rail. Spent on the next series to start, and on nothing else. */
  highlight?: boolean;
}

/**
 * The four desktop column sets, written out in full.
 *
 * Not composed from parts: Tailwind reads class names out of the source text, so
 * a template-built `grid-cols-[…]` produces no CSS at all. The lead cell is the
 * only thing that varies — a dated kickoff needs room for "Sun 23 Aug" over the
 * clock, where a bare time does not.
 */
const COLUMNS = {
  league: {
    clock: "sm:grid-cols-[4.75rem_6.5rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)_5.5rem]",
    dated: "sm:grid-cols-[6.5rem_6.5rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)_5.5rem]",
  },
  bare: {
    clock: "sm:grid-cols-[4.75rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)_5.5rem]",
    dated: "sm:grid-cols-[6.5rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)_5.5rem]",
  },
} as const;

function Side({
  team,
  align,
  muted,
}: {
  team: EsportsEventTeam | undefined;
  align: "left" | "right";
  muted: boolean;
}): React.ReactElement {
  if (!team) {
    return (
      <span className={`hud-label truncate ${align === "right" ? "text-right" : ""}`}>TBD</span>
    );
  }

  return (
    <span
      className={`flex min-w-0 items-center gap-2.5 ${align === "right" ? "flex-row-reverse" : ""}`}
    >
      <TeamCrest src={team.image} code={team.code || team.name} size={24} />
      <span
        title={team.name}
        className={`truncate font-display text-sm font-bold uppercase tracking-[0.05em] ${
          muted ? "text-text-faint" : "text-text"
        }`}
      >
        {team.code || team.name}
      </span>
    </span>
  );
}

/**
 * One series as a dense HUD line, for lists that run inside a single panel.
 *
 * Deliberately not `MatchRow`: that one is a self-contained card, which is right
 * for a handful of fixtures on a hub and wrong for eighty of them under a day
 * heading, where the eye wants a table and the borders want to be shared.
 *
 * Cells are placed by auto-flow rather than by explicit coordinates, so the same
 * markup folds from a six-column line into a two-column stack without either
 * layout having to know the other's column count.
 */
export function SeriesRow({
  event,
  href,
  showLeague = true,
  withDate = false,
  outcome = null,
  highlight = false,
}: SeriesRowProps): React.ReactElement {
  const [home, away] = event.teams;
  const decided = event.state === "completed";
  const live = event.state === "inProgress";

  const rail =
    highlight || outcome === "win"
      ? "border-l-accent"
      : live || outcome === "loss"
        ? "border-l-danger"
        : "border-l-transparent";

  const body = (
    <>
      <span className="grid gap-0.5">
        {outcome ? (
          <span
            className={`font-mono text-[10px] font-bold uppercase tracking-label ${
              outcome === "win" ? "text-accent" : "text-danger"
            }`}
          >
            {outcome === "win" ? "Win" : "Loss"}
          </span>
        ) : live ? (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-label text-danger">
            <span className="h-1.5 w-1.5 bg-danger motion-safe:animate-pulse" aria-hidden />
            Live
          </span>
        ) : (
          <MatchTime
            startTime={event.startTime}
            withDate={withDate}
            className={`font-mono text-[13px] leading-tight ${
              highlight ? "text-accent" : decided ? "text-text-body" : "text-text"
            }`}
          />
        )}
        {highlight && <span className="hud-label text-[9px]">Next up</span>}
      </span>

      {showLeague && (
        <span className="grid min-w-0 gap-0.5">
          <span className="truncate font-mono text-[10px] uppercase tracking-label text-text-muted">
            {event.league.name}
          </span>
          {event.blockName && (
            <span className="truncate font-mono text-[9px] uppercase tracking-label text-text-faint">
              {event.blockName}
            </span>
          )}
        </span>
      )}

      <span className="col-span-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5 sm:col-span-3 sm:gap-3.5">
        <Side team={home} align="right" muted={decided && home?.outcome === "loss"} />
        {decided || live ? (
          <span className="whitespace-nowrap text-center font-mono text-base font-bold text-text">
            {home?.gameWins ?? 0}
            <span className="mx-1 text-text-faint">–</span>
            {away?.gameWins ?? 0}
          </span>
        ) : (
          <span className="hud-label whitespace-nowrap text-center">
            {event.bestOf ? `Bo${event.bestOf}` : "vs"}
          </span>
        )}
        <Side team={away} align="left" muted={decided && away?.outcome === "loss"} />
      </span>

      {/* Hidden on phones, where the middle cell already prints the format and
          the row has no width to spare for a repeat of it. */}
      <span className="hidden text-right font-mono text-[9.5px] uppercase tracking-label text-text-faint sm:block">
        {decided ? (
          <>
            Final
            {event.hasVod && <span className="ml-1.5 text-accent">VOD</span>}
          </>
        ) : event.bestOf ? (
          `Best of ${event.bestOf}`
        ) : null}
      </span>
    </>
  );

  const className = [
    "grid grid-cols-2 items-center gap-x-3.5 gap-y-2 border-b border-l-2 border-b-line-1 px-4 py-2.5",
    "transition-colors last:border-b-0 hover:bg-surface-2 sm:gap-y-0",
    rail,
    highlight ? "bg-surface-2" : "",
    COLUMNS[showLeague ? "league" : "bare"][withDate ? "dated" : "clock"],
  ].join(" ");

  if (!href) return <article className={className}>{body}</article>;

  return (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}
