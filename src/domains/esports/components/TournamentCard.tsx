import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { TournamentStateBadge } from "@/domains/esports/components/TournamentStateBadge";
import {
  formatTournamentDates,
  relativeTiming,
  tournamentName,
  tournamentProgress,
  tournamentState,
} from "@/domains/esports/tournaments";
import type { TournamentOverviewEntry } from "@/domains/esports/services/tournamentOverviewService";

/**
 * How far through a running split today is, as a bar and a count. A split's
 * length is the one thing a reader cannot see from its dates at a glance.
 */
function Progress({ day, of }: { day: number; of: number }): React.ReactElement {
  const percent = Math.round((day / of) * 100);
  return (
    <div className="mt-3">
      <div
        className="h-1.5 bg-surface-dark"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={of}
        aria-valuenow={day}
        aria-label={`Day ${day} of ${of}`}
      >
        <div className="h-1.5 bg-accent" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 font-mono text-[11px] text-text-muted">
        Day {day} of {of}
      </p>
    </div>
  );
}

/** "G2 Esports · 3–0 over Movistar KOI in the final", hidden in spoiler mode. */
export function ChampionLine({
  champion,
}: {
  champion: NonNullable<TournamentOverviewEntry["champion"]>;
}): React.ReactElement {
  return (
    <p className="mt-3 flex items-start gap-2 text-sm text-text-body">
      <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
      <span data-spoiler="">
        <span className="font-bold text-text">{champion.winner.name}</span>
        {champion.runnerUp ? ` · ${champion.score} over ${champion.runnerUp.name}` : ""}
      </span>
    </p>
  );
}

/**
 * One tournament: whose it is, when, where it stands today, and — once it is
 * over — who won it.
 */
export function TournamentCard({
  entry,
  today,
}: {
  entry: TournamentOverviewEntry;
  today: string;
}): React.ReactElement {
  const { tournament, league, champion } = entry;
  const state = tournamentState(tournament, today);
  const progress = state === "running" ? tournamentProgress(tournament, today) : null;

  return (
    <Link
      href={`/esports/tournaments/${tournament.slug}`}
      className="gaming-card notch-sm block px-4 py-3.5 transition-colors hover:border-line-2"
    >
      <span className="flex items-start gap-3">
        {league.image ? (
          <Image
            src={league.image}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
            aria-hidden
            unoptimized
          />
        ) : (
          <span className="h-8 w-8 shrink-0" aria-hidden />
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[11px] uppercase tracking-label text-text-muted">
            {league.name}
          </span>
          <span className="block font-display text-base font-extrabold uppercase leading-tight text-text">
            {tournamentName(tournament, league)}
          </span>
          <span className="mt-1 block text-[13px] text-text-muted">
            {formatTournamentDates(tournament)}
          </span>
        </span>
      </span>

      <span className="mt-3 block">
        <TournamentStateBadge state={state} detail={relativeTiming(tournament, today)} />
      </span>

      {progress && <Progress day={progress.day} of={progress.of} />}
      {champion && <ChampionLine champion={champion} />}
    </Link>
  );
}
