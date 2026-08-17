"use client";

interface Rank {
  tier: string;
  division: string;
  lp: number;
}

interface MilestoneRankJourneyProps {
  rankStart: Rank | null;
  rankEnd: Rank | null;
  lpChange: number;
}

function format(rank: Rank | null): string {
  return rank ? `${rank.tier} ${rank.division} · ${rank.lp} LP` : "Unranked";
}

/**
 * Where the month started, what it netted, where it left you.
 *
 * Three figures on one line rather than a card each: the whole point is the
 * relationship between them, and a reader should not have to hold two numbers
 * in their head to see whether the month went anywhere.
 */
export function MilestoneRankJourney({
  rankStart,
  rankEnd,
  lpChange,
}: MilestoneRankJourneyProps): React.JSX.Element | null {
  if (!rankStart && !rankEnd) return null;

  const climbed = lpChange > 0;
  const lpClass = climbed ? "text-acid-500" : lpChange < 0 ? "text-danger" : "text-fg-3";
  const note = climbed ? "Gained ground" : lpChange < 0 ? "Lost ground" : "No net change";

  return (
    <section className="notch border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line-1 px-5 py-3">
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
          {"// RANK JOURNEY"}
        </span>
        <span className={`font-mono text-[10.5px] uppercase tracking-wide ${lpClass}`}>{note}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-5">
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-label text-text-muted">
            Month start
          </div>
          <div className="mt-1.5 font-display text-lg font-extrabold uppercase tracking-wide text-fg-2">
            {format(rankStart)}
          </div>
        </div>

        <div className="text-center">
          <div className={`font-mono text-2xl font-bold tabular-nums ${lpClass}`}>
            {climbed ? "+" : ""}
            {lpChange}
          </div>
          <div className="mt-1 font-mono text-[9.5px] uppercase tracking-label text-fg-4">
            net LP
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-[9.5px] uppercase tracking-label text-text-muted">Now</div>
          <div className="mt-1.5 font-display text-lg font-extrabold uppercase tracking-wide text-acid-500">
            {format(rankEnd)}
          </div>
        </div>
      </div>
    </section>
  );
}
