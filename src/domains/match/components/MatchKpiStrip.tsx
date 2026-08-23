"use client";

import type { ParticipantDetail } from "@/domains/match";

interface MatchKpiStripProps {
  me: ParticipantDetail;
  participants: ParticipantDetail[];
}

interface Kpi {
  label: string;
  value: string;
  /** Your figure and the best anyone in this game managed, in the same unit. */
  mine: number;
  best: number;
  /** Lower is better — the bar then reads distance from the worst. */
  invert?: boolean;
}

function format(value: number, digits: number): string {
  return value.toFixed(digits);
}

/**
 * Your six numbers, measured against the game they came from.
 *
 * A bare figure ("vision 4") means nothing without a scale, and this page has
 * no access to rank benchmarks — but it does have the other nine players. The
 * bar is your share of the best anyone managed here, which is a claim the page
 * can actually back up.
 */
export function MatchKpiStrip({ me, participants }: MatchKpiStripProps): React.JSX.Element {
  const max = (read: (p: ParticipantDetail) => number): number =>
    Math.max(...participants.map(read), 0);

  const kpis: Kpi[] = [
    { label: "KDA", value: format(me.kda, 2), mine: me.kda, best: max((p) => p.kda) },
    {
      // Both of these arrive as 0–1 ratios from the performance calculator.
      label: "Kill part.",
      value: `${Math.round(me.killParticipation * 100)}%`,
      mine: me.killParticipation,
      best: max((p) => p.killParticipation),
    },
    {
      label: "CS/min",
      value: format(me.csPerMinute, 1),
      mine: me.csPerMinute,
      best: max((p) => p.csPerMinute),
    },
    {
      label: "Dmg share",
      value: `${(me.damageShare * 100).toFixed(1)}%`,
      mine: me.damageShare,
      best: max((p) => p.damageShare),
    },
    {
      label: "Vision",
      value: String(me.visionScore),
      mine: me.visionScore,
      best: max((p) => p.visionScore),
    },
    {
      label: "Gold/min",
      value: String(Math.round(me.goldPerMinute)),
      mine: me.goldPerMinute,
      best: max((p) => p.goldPerMinute),
    },
  ];

  return (
    <section className="notch border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line-1 px-5 py-3">
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
          {"// YOUR GAME"}
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-fg-4">
          Bar = your share of the best in this game
        </span>
      </div>

      <div className="grid grid-cols-3 gap-px bg-line-1 md:grid-cols-6">
        {kpis.map((kpi) => {
          const share = kpi.best > 0 ? Math.min(100, Math.round((kpi.mine / kpi.best) * 100)) : 0;
          // Bottom third of the field is the only thing worth colouring red;
          // everything else is simply where you landed.
          const weak = share < 34;
          return (
            <div key={kpi.label} className="bg-surface px-4 py-4">
              <div className="font-mono text-[9.5px] uppercase tracking-label text-text-muted">
                {kpi.label}
              </div>
              <div
                className={`my-2 font-mono text-xl font-bold tabular-nums leading-none ${
                  weak ? "text-danger" : "text-fg-1"
                }`}
              >
                {kpi.value}
              </div>
              <div className="h-[3px] bg-surface-dark">
                <span
                  className={`block h-[3px] ${weak ? "bg-danger" : "bg-acid-500"}`}
                  style={{ width: `${share}%` }}
                />
              </div>
              <div className="mt-2 font-mono text-[9.5px] uppercase tracking-wide text-fg-4">
                {share}% of best
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
