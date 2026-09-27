import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { matchupSlug } from "@/domains/meta";
import { barWidth, matchupEdge } from "@/domains/meta/counterBar";
import type { CounterMatchup } from "@/domains/meta";
import { formatCount } from "@/lib/uiLocale";

type Tone = "good" | "bad";

const TONE = {
  good: { bar: "bg-success", text: "text-success", edge: "border-l-success" },
  bad: { bar: "bg-danger", text: "text-danger", edge: "border-l-danger" },
} as const;

function MatchupRow({
  matchup,
  width,
  tone,
  rank,
  subjectKey,
}: {
  matchup: CounterMatchup;
  width: number;
  tone: Tone;
  rank: number;
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
      className={`group grid grid-cols-[18px_36px_minmax(0,1fr)_auto] items-center gap-3 border border-l-2 border-border bg-surface px-3 py-2 transition-colors hover:border-accent/40 hover:bg-surface-2 ${TONE[tone].edge}`}
    >
      <span className="font-mono text-[11px] tabular-nums text-text-muted">{rank}</span>
      <ChampionIcon name={matchup.championKey} size={36} className="shrink-0" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-text group-hover:text-accent">
          {matchup.name}
        </span>
        {/* Relative cue only — the percentage beside it is the accessible value. */}
        <span aria-hidden className="mt-1.5 block h-1 w-full max-w-[220px] bg-surface-dark">
          <span className={`block h-1 ${TONE[tone].bar}`} style={{ width: `${width}%` }} />
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span
          className={`block font-mono text-[15px] font-bold tabular-nums leading-none ${TONE[tone].text}`}
        >
          {matchup.opponentWinRate.toFixed(1)}%
        </span>
        <span className="mt-1 block font-mono text-[10px] tabular-nums text-text-muted">
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
    <div className="min-w-0">
      <h2
        className={`flex items-center gap-2 font-display text-[17px] font-black uppercase tracking-[0.03em] ${TONE[tone].text}`}
      >
        <span aria-hidden>{tone === "good" ? "▲" : "▼"}</span>
        <span className="text-text">{title}</span>
      </h2>
      <p className="mb-3 mt-1 text-xs text-text-muted">{subtitle}</p>
      {matchups.length === 0 ? (
        <p className="notch border border-border bg-surface px-3 py-6 text-center text-sm text-text-muted">
          {emptyLabel}
        </p>
      ) : (
        <div className="notch flex flex-col gap-1">
          {matchups.map((m, i) => (
            <MatchupRow
              key={m.championId}
              rank={i + 1}
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
