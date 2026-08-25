import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { matchupSlug } from "@/domains/meta";
import { barWidth, matchupEdge } from "@/domains/meta/counterBar";
import type { CounterMatchup } from "@/domains/meta";
import { formatCount } from "@/lib/uiLocale";

type Tone = "good" | "bad";

const TONE = {
  good: { bar: "bg-success/25", text: "text-success" },
  bad: { bar: "bg-danger/25", text: "text-danger" },
} as const;

function MatchupRow({
  matchup,
  width,
  tone,
  subjectKey,
}: {
  matchup: CounterMatchup;
  width: number;
  tone: Tone;
  subjectKey?: string;
}) {
  // With a subject, link to the head-to-head matchup guide; otherwise to the
  // opponent's own counters page.
  const href = subjectKey
    ? `/matchups/${matchupSlug(subjectKey, matchup.championKey)}`
    : `/counters/${matchup.championKey}`;

  return (
    <Link
      href={href}
      className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:border-accent/40"
    >
      {/* Relative cue only — the percentage beside it is the accessible value. */}
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 ${TONE[tone].bar}`}
        style={{ width: `${width}%` }}
      />
      <ChampionIcon name={matchup.championKey} size={36} className="relative shrink-0" />
      <span className="relative min-w-0 flex-1 truncate text-sm font-medium text-text">
        {matchup.name}
      </span>
      <span className="relative shrink-0 text-right">
        <span className={`block text-sm font-bold ${TONE[tone].text}`}>
          {matchup.opponentWinRate.toFixed(1)}%
        </span>
        <span className="block text-[10px] text-text-muted">
          {formatCount(matchup.games)} games
        </span>
      </span>
    </Link>
  );
}

function MatchupColumn({
  title,
  subtitle,
  matchups,
  tone,
  emptyLabel,
  subjectKey,
}: {
  title: string;
  subtitle: string;
  matchups: CounterMatchup[];
  tone: Tone;
  emptyLabel: string;
  subjectKey?: string;
}) {
  const edges = matchups.map((m) => matchupEdge(m.opponentWinRate));

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
              width={barWidth(matchupEdge(m.opponentWinRate), edges)}
              tone={tone}
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
    // Both columns report the same number — the win rate of the champion you would pick into
    // {name}. Showing {name}'s own win rate on the right made the two sides answer different
    // questions and buried the fact that these picks lose.
    <div className="grid gap-8 md:grid-cols-2">
      <MatchupColumn
        title={`Best picks against ${name}`}
        subtitle={`How often these champions beat ${name}. Pick one of these into it.`}
        matchups={strongAgainstSubject}
        tone="good"
        emptyLabel="Not enough ranked data for this lane yet."
        subjectKey={subjectKey}
      />
      <MatchupColumn
        title={`Worst picks against ${name}`}
        subtitle={`How often these champions beat ${name} — they mostly don't. Avoid picking them into it.`}
        matchups={weakAgainstSubject}
        tone="bad"
        emptyLabel="Not enough ranked data for this lane yet."
        subjectKey={subjectKey}
      />
    </div>
  );
}
