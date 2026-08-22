"use client";

import { cn } from "@/lib/utils";
import type { ArchiveTotals } from "@/domains/match/services/matchArchiveService";

interface ArchiveTotalsStripProps {
  totals: ArchiveTotals | null;
  isLoading: boolean;
}

/**
 * The stats of the whole filtered set, not of the rows on screen.
 *
 * That distinction is the reason the strip exists: scrolling further down a search must not move
 * the win rate. The API sends these once with the first page and `null` with every continuation, so
 * a `null` here means "still loading" and never "the numbers went away" — the caller reads them off
 * page zero and holds them for the life of the search.
 */
export function ArchiveTotalsStrip({
  totals,
  isLoading,
}: ArchiveTotalsStripProps): React.JSX.Element | null {
  if (isLoading && !totals) {
    return (
      <div className="notch h-[74px] animate-pulse border border-line-1 bg-surface-2/40" />
    );
  }
  if (!totals || totals.games === 0) return null;

  return (
    <section
      aria-label="Totals for this search"
      className="notch grid grid-cols-2 gap-px overflow-hidden border border-line-1 bg-line-1 sm:grid-cols-3 lg:grid-cols-6"
    >
      <Cell label="Games" value={String(totals.games)} />
      <Cell
        label="Record"
        value={`${totals.wins}W ${totals.losses}L`}
      />
      <Cell
        label="Win rate"
        value={`${totals.winRate.toFixed(1)}%`}
        tone={totals.winRate >= 50 ? "good" : "bad"}
      />
      <Cell label="KDA" value={totals.avgKda.toFixed(2)} />
      <Cell label="CS / min" value={totals.avgCsPerMinute.toFixed(1)} />
      <Cell label="Vision" value={totals.avgVisionScore.toFixed(1)} />
    </section>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}): React.JSX.Element {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="font-mono text-[9.5px] uppercase tracking-label text-fg-4">{label}</p>
      <p
        className={cn(
          "mt-0.5 font-display text-lg font-bold tabular-nums",
          tone === "good" ? "text-acid-500" : tone === "bad" ? "text-danger" : "text-fg-1"
        )}
      >
        {value}
      </p>
    </div>
  );
}
