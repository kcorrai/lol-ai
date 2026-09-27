import Link from "next/link";
import { TournamentStateBadge } from "@/domains/esports/components/TournamentStateBadge";
import {
  formatTournamentDates,
  tournamentName,
  tournamentState,
} from "@/domains/esports/tournaments";
import type { EsportsLeague, EsportsTournament } from "@/domains/esports/types";

/** How many splits show before the rest fold away. */
const SHOWN = 8;

function Row({
  tournament,
  league,
  current,
  today,
}: {
  tournament: EsportsTournament;
  league: EsportsLeague;
  current: boolean;
  today: string;
}): React.ReactElement {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        <Link
          href={`/esports/tournaments/${tournament.slug}`}
          className={`hover:text-accent ${current ? "font-bold text-text" : "text-text-body"}`}
        >
          {tournamentName(tournament, league)}
        </Link>
        <TournamentStateBadge state={tournamentState(tournament, today)} />
      </span>
      <span className="font-mono text-[11px] text-text-muted">
        {formatTournamentDates(tournament) || "—"}
      </span>
    </li>
  );
}

/**
 * Every split the league has published, newest first, each with where it
 * stands. The first few are listed; the rest fold behind a count, so nothing
 * the feed publishes is out of reach and the page does not end in a wall of
 * old splits.
 */
export function SplitList({
  league,
  tournaments,
  currentId,
  today,
}: {
  league: EsportsLeague;
  tournaments: EsportsTournament[];
  currentId: string | null;
  today: string;
}): React.ReactElement {
  const row = (tournament: EsportsTournament): React.ReactElement => (
    <Row
      key={tournament.id}
      tournament={tournament}
      league={league}
      current={tournament.id === currentId}
      today={today}
    />
  );
  const rest = tournaments.slice(SHOWN);

  return (
    <div>
      <ul>{tournaments.slice(0, SHOWN).map(row)}</ul>
      {rest.length > 0 && (
        <details className="group mt-2">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-label text-accent hover:underline">
            <span className="group-open:hidden">Show all {tournaments.length} splits</span>
            <span className="hidden group-open:inline">Show fewer</span>
          </summary>
          <ul className="mt-1">{rest.map(row)}</ul>
        </details>
      )}
    </div>
  );
}
