"use client";

import type { MonthlyMilestone } from "@/domains/analysis/services/milestoneService";

interface MilestoneNumbersProps {
  data: MonthlyMilestone;
  /** The month before this one, when it has been loaded — used for the deltas. */
  previous: MonthlyMilestone | null | undefined;
  previousLabel: string;
}

interface Kpi {
  label: string;
  value: string;
  sub: string;
  delta: number | null;
  /** Formats the delta in the metric's own unit. */
  format: (delta: number) => string;
  /**
   * Whether a rise is an improvement.
   *
   * Null for the two volume rows: playing more games or more hours than last
   * month is neither good nor bad, and colouring it green or red asserts a
   * judgement the number does not support.
   */
  higherIsBetter: boolean | null;
}

/**
 * The month in numbers, with last month underneath.
 *
 * A win rate on its own is a fact; a win rate next to the one before it is the
 * beginning of an argument. Deltas only render once the previous month has
 * loaded — an absent month shows the figure and nothing else rather than a
 * zero that reads like "no change".
 */
export function MilestoneNumbers({
  data,
  previous,
  previousLabel,
}: MilestoneNumbersProps): React.JSX.Element {
  const delta = (now: number, before: number | undefined): number | null =>
    before === undefined ? null : Math.round((now - before) * 100) / 100;

  const kpis: Kpi[] = [
    {
      label: "Matches",
      value: String(data.gamesPlayed),
      sub: `${data.wins}W · ${data.losses}L`,
      delta: delta(data.gamesPlayed, previous?.gamesPlayed),
      format: (d) => `${d > 0 ? "+" : ""}${d}`,
      higherIsBetter: null,
    },
    {
      label: "Win rate",
      value: `${data.winRate}%`,
      sub: "Ranked solo",
      delta: delta(data.winRate, previous?.winRate),
      format: (d) => `${d > 0 ? "+" : ""}${d}pt`,
      higherIsBetter: true,
    },
    {
      label: "Avg KDA",
      value: data.avgKda.toFixed(2),
      sub: `Best ${data.bestKda.toFixed(2)}`,
      delta: delta(data.avgKda, previous?.avgKda),
      format: (d) => `${d > 0 ? "+" : ""}${d.toFixed(2)}`,
      higherIsBetter: true,
    },
    {
      label: "Time played",
      value: `${data.estimatedHours}h`,
      sub: `${data.avgCsPerMin.toFixed(1)} CS/min`,
      delta: delta(data.estimatedHours, previous?.estimatedHours),
      format: (d) => `${d > 0 ? "+" : ""}${d}h`,
      higherIsBetter: null,
    },
  ];

  return (
    <section className="notch border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line-1 px-5 py-3">
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
          {"// THE MONTH IN NUMBERS"}
        </span>
        {previous && (
          <span className="font-mono text-[10.5px] uppercase tracking-wide text-fg-4">
            Delta vs {previousLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px bg-line-1 md:grid-cols-4">
        {kpis.map((kpi) => {
          const neutral = kpi.higherIsBetter === null;
          const good = kpi.delta !== null && kpi.delta > 0 === kpi.higherIsBetter;
          return (
            <div key={kpi.label} className="bg-surface px-4 py-4">
              <div className="font-mono text-[9.5px] uppercase tracking-label text-text-muted">
                {kpi.label}
              </div>
              <div className="my-2.5 font-mono text-2xl font-bold tabular-nums leading-none text-fg-1">
                {kpi.value}
              </div>
              <div className="flex items-center justify-between gap-2.5">
                <span className="font-mono text-[10.5px] tracking-wide text-fg-4">{kpi.sub}</span>
                {kpi.delta !== null && kpi.delta !== 0 && (
                  <span
                    className={`font-mono text-[11.5px] ${
                      neutral ? "text-fg-3" : good ? "text-acid-500" : "text-danger"
                    }`}
                  >
                    {kpi.format(kpi.delta)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
