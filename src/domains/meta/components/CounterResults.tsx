import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { CounterMatchup } from "@/domains/meta";

function MatchupRow({ matchup, metric }: { matchup: CounterMatchup; metric: number }) {
  const good = metric >= 50;
  return (
    <Link
      href={`/counters/${matchup.championKey}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:border-accent/40 hover:bg-surface-2"
    >
      <ChampionIcon name={matchup.championKey} size={36} />
      <span className="flex-1 truncate text-sm font-medium text-text">{matchup.name}</span>
      <span className="text-right">
        <span className={`block text-sm font-bold ${good ? "text-success" : "text-danger"}`}>
          {metric.toFixed(1)}%
        </span>
        <span className="block text-[10px] text-text-muted">
          {matchup.games.toLocaleString()} games
        </span>
      </span>
    </Link>
  );
}

function MatchupColumn({
  title,
  subtitle,
  matchups,
  metric,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  matchups: CounterMatchup[];
  metric: "opponent" | "subject";
  emptyLabel: string;
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-text">{title}</h2>
      <p className="mb-3 text-xs text-text-muted">{subtitle}</p>
      {matchups.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
          {emptyLabel}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {matchups.map((m) => (
            <MatchupRow
              key={m.championId}
              matchup={m}
              metric={metric === "opponent" ? m.opponentWinRate : m.subjectWinRate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CounterResults({
  name,
  strongAgainstSubject,
  weakAgainstSubject,
}: {
  name: string;
  strongAgainstSubject: CounterMatchup[];
  weakAgainstSubject: CounterMatchup[];
}) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <MatchupColumn
        title={`Best counters for ${name}`}
        subtitle={`Champions with the highest win rate against ${name}. Pick these to beat it.`}
        matchups={strongAgainstSubject}
        metric="opponent"
        emptyLabel="Not enough ranked data for this lane yet."
      />
      <MatchupColumn
        title={`${name} is strong against`}
        subtitle={`Matchups where ${name} has the highest win rate. Avoid blind-picking into it.`}
        matchups={weakAgainstSubject}
        metric="subject"
        emptyLabel="Not enough ranked data for this lane yet."
      />
    </div>
  );
}
