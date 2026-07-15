import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { matchupSlug } from "@/domains/meta";
import type { CounterMatchup } from "@/domains/meta";

function MatchupRow({
  matchup,
  metric,
  subjectKey,
}: {
  matchup: CounterMatchup;
  metric: number;
  subjectKey?: string;
}) {
  const good = metric >= 50;
  // With a subject, link to the head-to-head matchup guide; otherwise to the
  // opponent's own counters page.
  const href = subjectKey
    ? `/matchups/${matchupSlug(subjectKey, matchup.championKey)}`
    : `/counters/${matchup.championKey}`;
  return (
    <Link
      href={href}
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
  subjectKey,
}: {
  title: string;
  subtitle: string;
  matchups: CounterMatchup[];
  metric: "opponent" | "subject";
  emptyLabel: string;
  subjectKey?: string;
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
              subjectKey={subjectKey}
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
  subjectKey,
}: {
  name: string;
  strongAgainstSubject: CounterMatchup[];
  weakAgainstSubject: CounterMatchup[];
  subjectKey?: string; // when set, rows deep-link to the head-to-head matchup guide
}) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <MatchupColumn
        title={`Best counters for ${name}`}
        subtitle={`Champions with the highest win rate against ${name}. Pick these to beat it.`}
        matchups={strongAgainstSubject}
        metric="opponent"
        emptyLabel="Not enough ranked data for this lane yet."
        subjectKey={subjectKey}
      />
      <MatchupColumn
        title={`${name} is strong against`}
        subtitle={`Matchups where ${name} has the highest win rate. Avoid blind-picking into it.`}
        matchups={weakAgainstSubject}
        metric="subject"
        emptyLabel="Not enough ranked data for this lane yet."
        subjectKey={subjectKey}
      />
    </div>
  );
}
