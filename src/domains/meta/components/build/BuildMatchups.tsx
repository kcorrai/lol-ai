import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";

export interface BuildMatchup {
  key: string;
  name: string;
  /** The subject champion's win rate into this opponent, 0-100. */
  winRate: number;
  games: number;
}

// The bar spans the band matchups actually fall in; a 0-100 axis would leave every row a stub.
const WORST = 38;
const BEST = 62;

/** Who beats this champion, with the win rate and the sample behind each row. */
export function BuildMatchups({
  name,
  championKey,
  matchups,
}: {
  name: string;
  championKey: string;
  matchups: BuildMatchup[];
}): React.ReactElement | null {
  if (matchups.length === 0) return null;

  return (
    <section className="notch border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-1 px-5 py-3">
        <span className="hud-label text-[10.5px]">{`// Matchups · who beats ${name}`}</span>
        <Link
          href={`/counters/${championKey}`}
          className="font-mono text-[10px] uppercase tracking-label text-accent hover:underline"
        >
          All matchups →
        </Link>
      </div>

      {matchups.map((matchup) => {
        const pct = Math.max(4, Math.min(100, ((matchup.winRate - WORST) / (BEST - WORST)) * 100));
        return (
          <Link
            key={matchup.key}
            href={`/counters/${matchup.key}`}
            className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-line-1 px-5 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2/60 sm:grid-cols-[32px_minmax(0,1fr)_120px_72px_80px]"
          >
            <ChampionIcon name={matchup.key} size={32} />
            <span className="truncate text-[13.5px] text-text">{matchup.name}</span>
            <span className="hidden h-1 bg-surface-dark sm:block">
              <span className="block h-1 bg-danger" style={{ width: `${pct}%` }} />
            </span>
            <span className="text-right font-mono text-[13px] tabular-nums text-danger">
              {matchup.winRate.toFixed(1)}%
            </span>
            <span className="hidden text-right font-mono text-[10.5px] tracking-[0.1em] text-text-faint sm:block">
              {matchup.games.toLocaleString()}
            </span>
          </Link>
        );
      })}
    </section>
  );
}
