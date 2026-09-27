import Link from "next/link";
import { ChampionLine, TournamentProgress } from "@/domains/esports/components/TournamentCard";
import { TournamentStateBadge } from "@/domains/esports/components/TournamentStateBadge";
import {
  formatTournamentDates,
  relativeTiming,
  tournamentChampion,
  tournamentName,
  tournamentProgress,
  tournamentState,
} from "@/domains/esports/tournaments";
import type { EsportsLeague, EsportsTournament, StandingsStage } from "@/domains/esports/types";

/**
 * Where the league's season stands, said before any table: which split this
 * is, how far through it is, what stage it is in — or, once it is over, who won
 * it and when the next one starts.
 */
export function LeagueSplitStatus({
  league,
  current,
  stages,
  stageNow,
  nextUp,
  today,
}: {
  league: EsportsLeague;
  current: EsportsTournament;
  stages: StandingsStage[];
  /** The block the next scheduled match is in, e.g. "Playoffs". */
  stageNow: string | null;
  nextUp: EsportsTournament | undefined;
  today: string;
}): React.ReactElement {
  const state = tournamentState(current, today);
  const progress = state === "running" ? tournamentProgress(current, today) : null;
  const champion = state === "ended" ? tournamentChampion(stages) : null;

  return (
    <section className="gaming-card notch-sm mb-10 px-4 py-4">
      <p className="hud-label">{state === "ended" ? "Last split" : "Current split"}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href={`/esports/tournaments/${current.slug}`}
          className="font-display text-lg font-extrabold uppercase text-text hover:text-accent"
        >
          {tournamentName(current, league)}
        </Link>
        <TournamentStateBadge state={state} detail={relativeTiming(current, today)} />
      </div>
      <p className="mt-1 text-sm text-text-muted">
        {formatTournamentDates(current)}
        {state === "running" && stageNow ? ` · Now in ${stageNow}` : ""}
      </p>

      {progress && <TournamentProgress day={progress.day} of={progress.of} />}
      {champion && <ChampionLine champion={champion} />}

      {state === "ended" && nextUp && (
        <p className="mt-3 border-t border-line-1 pt-3 text-sm text-text-body">
          Next:{" "}
          <Link
            href={`/esports/tournaments/${nextUp.slug}`}
            className="text-text hover:text-accent"
          >
            {tournamentName(nextUp, league)}
          </Link>{" "}
          — {relativeTiming(nextUp, today).toLowerCase()} ({formatTournamentDates(nextUp)}).
        </p>
      )}
    </section>
  );
}
