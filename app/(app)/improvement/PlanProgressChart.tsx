"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  MatchPerformance,
  PlanMetric,
  PlanProgress,
} from "@/domains/analysis/types/analysis.types";
import { formatMetric } from "./planView";

type ChartMetric = "cs" | "deaths" | "kda";

interface PlanProgressChartProps {
  matches: MatchPerformance[];
  targets: PlanProgress[];
}

interface MetricSpec {
  label: string;
  short: string;
  /** Lower is better, so a bar under the goal line is the good one. */
  invert: boolean;
  read: (match: MatchPerformance) => number;
  /** The plan metric this chart tab corresponds to, for pulling the goal. */
  planMetric: PlanMetric;
}

const METRICS: Record<ChartMetric, MetricSpec> = {
  cs: {
    label: "CS per minute",
    short: "CS/min",
    invert: false,
    read: (m) => m.csPerMinute,
    planMetric: "csPerMinute",
  },
  deaths: {
    label: "Deaths per game",
    short: "Deaths",
    invert: true,
    read: (m) => m.deaths,
    planMetric: "deaths",
  },
  kda: {
    label: "KDA",
    short: "KDA",
    invert: false,
    read: (m) => (m.kills + m.assists) / Math.max(m.deaths, 1),
    planMetric: "kda",
  },
};

const TABS: ChartMetric[] = ["cs", "deaths", "kda"];

/**
 * Per-game movement across the games behind the plan.
 *
 * Read straight from the performance profile's recent matches rather than a
 * stored series: the plan's progress figures come from the same profile, so a
 * separate source would let the chart and the targets disagree about the same
 * games.
 */
export function PlanProgressChart({ matches, targets }: PlanProgressChartProps): React.JSX.Element | null {
  const [metric, setMetric] = useState<ChartMetric>("cs");
  const spec = METRICS[metric];

  // Oldest first, so the axis runs left-to-right in time like the labels say.
  const series = useMemo(() => {
    return [...matches]
      .sort((a, b) => new Date(a.gameStart).getTime() - new Date(b.gameStart).getTime())
      .map((m) => spec.read(m))
      .filter((v) => Number.isFinite(v));
  }, [matches, spec]);

  if (series.length === 0) return null;

  const goal = targets.find((t) => t.metric === spec.planMetric)?.goal ?? null;
  const ceiling = Math.max(...series, goal ?? 0) * 1.15 || 1;

  return (
    <section className="notch border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-1 px-5 py-3">
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
          {"// "}
          {spec.label} · {series.length} GAMES
        </span>
        <div className="flex gap-1">
          {TABS.map((key) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={cn(
                "tag-cut border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors",
                key === metric
                  ? "border-acid-500 bg-acid-500/10 text-acid-500"
                  : "border-line-2 text-fg-3 hover:text-fg-1"
              )}
            >
              {METRICS[key].short}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="well relative flex h-[150px] items-end gap-1 bg-surface-dark px-2.5 pt-2.5">
          {goal !== null && (
            <span
              className="pointer-events-none absolute inset-x-2.5 border-t border-dashed border-fg-3 opacity-70"
              style={{ bottom: `${(goal / ceiling) * 100}%` }}
              aria-hidden
            />
          )}
          {series.map((value, i) => {
            const met = spec.invert ? goal !== null && value <= goal : goal !== null && value >= goal;
            return (
              <span
                key={i}
                title={`Game ${i + 1} · ${formatMetric(value)}`}
                className={cn(
                  "min-w-[3px] flex-1",
                  goal === null ? "bg-line-3" : met ? "bg-acid-500" : "bg-warning",
                  i === series.length - 1 ? "opacity-100" : "opacity-60"
                )}
                style={{ height: `${Math.max(4, (value / ceiling) * 100)}%` }}
              />
            );
          })}
        </div>
        <div className="mt-2.5 flex justify-between font-mono text-[10px] uppercase tracking-wide text-fg-4">
          <span>Oldest</span>
          {goal !== null && <span>Dashed line = goal</span>}
          <span>Latest</span>
        </div>
      </div>
    </section>
  );
}
