import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";

export interface RailMatchup {
  key: string;
  name: string;
  /** This champion's win rate into that opponent, 0-100. */
  winRate: number;
}

interface ChampionRailProps {
  name: string;
  championKey: string;
  worst: RailMatchup[];
  best: RailMatchup[];
  laneLabel: string | null;
}

const PANEL = "notch border border-border bg-surface";
const HEAD =
  "flex items-center justify-between gap-2.5 border-b border-line-1 px-4 py-3 font-mono text-[10.5px] uppercase tracking-label text-text-muted";

function MatchupList({
  matchups,
  tone,
}: {
  matchups: RailMatchup[];
  tone: "danger" | "accent";
}): React.ReactElement {
  return (
    <>
      {matchups.map((matchup) => (
        <Link
          key={matchup.key}
          href={`/champions/${matchup.key}`}
          className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-line-1 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2/60"
        >
          <ChampionIcon name={matchup.key} size={28} />
          <span className="truncate text-[13px] text-text">{matchup.name}</span>
          <span
            className={`font-mono text-[12.5px] tabular-nums ${tone === "danger" ? "text-danger" : "text-accent"}`}
          >
            {matchup.winRate.toFixed(1)}%
          </span>
        </Link>
      ))}
    </>
  );
}

/** Who beats this champion, who they beat, and where to go next. */
export function ChampionRail({
  name,
  championKey,
  worst,
  best,
  laneLabel,
}: ChampionRailProps): React.ReactElement {
  const related = [
    { label: `${name} build${laneLabel ? ` · ${laneLabel}` : ""}`, href: `/builds/${championKey}` },
    { label: `${name} ARAM build`, href: `/aram/${championKey}` },
    { label: `${name} counters`, href: `/counters/${championKey}` },
    { label: "Tier list", href: "/tools/tier-list" },
  ];

  return (
    <div className="grid gap-3.5 lg:sticky lg:top-6">
      {worst.length > 0 && (
        <section className={PANEL}>
          <div className={HEAD}>
            <span>{"// Worst matchups"}</span>
            <Link
              href={`/counters/${championKey}`}
              className="font-mono text-[9.5px] uppercase tracking-label text-accent hover:underline"
            >
              All →
            </Link>
          </div>
          <MatchupList matchups={worst} tone="danger" />
        </section>
      )}

      {best.length > 0 && (
        <section className={PANEL}>
          <div className={HEAD}>
            <span>{"// Good into"}</span>
          </div>
          <MatchupList matchups={best} tone="accent" />
        </section>
      )}

      <section className={PANEL}>
        <div className={HEAD}>
          <span>{`// More on ${name}`}</span>
        </div>
        {related.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-3 border-b border-line-1 px-4 py-3 text-[13.5px] text-text-body transition-colors last:border-b-0 hover:text-accent"
          >
            <span>{item.label}</span>
            <span aria-hidden className="font-mono text-text-faint">
              →
            </span>
          </Link>
        ))}
      </section>

      <section className="notch glow-accent-soft bg-hero-fade border border-accent bg-surface px-4 py-4">
        <p className="font-display text-[15px] font-extrabold uppercase leading-tight tracking-[0.03em] text-text">
          Want to climb with {name}?
        </p>
        <p className="mt-2.5 text-[13px] text-text-body">
          Your coach reads your own {name} games and tells you which of these habits you actually
          have.
        </p>
        <Link
          href="/register"
          className="notch-sm mt-3.5 flex h-[34px] items-center justify-center gap-1.5 bg-accent font-mono text-[11px] font-bold uppercase tracking-label text-background transition-opacity hover:opacity-90"
        >
          Get started free
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}
