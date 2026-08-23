"use client";

import { cn } from "@/lib/utils";
import type { PlanProgress } from "@/domains/analysis/types/analysis.types";
import {
  chipClass,
  formatMetric,
  targetDelta,
  targetStatusLabel,
  targetTone,
  toneFill,
  toneText,
} from "./planView";

interface PlanTargetsProps {
  targets: PlanProgress[];
  planEnded: boolean;
}

function TargetRow({
  target,
  planEnded,
}: {
  target: PlanProgress;
  planEnded: boolean;
}): React.JSX.Element {
  const tone = targetTone(target, planEnded);
  const unit = target.unit ?? "";
  const pct = Math.min(100, Math.max(0, Math.round(target.progress * 100)));

  return (
    <div className="border-b border-line-1 px-5 py-4 last:border-b-0">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3.5">
        <span className="flex items-center gap-3">
          <span className={chipClass(tone)}>{targetStatusLabel(target, planEnded)}</span>
          <span className="font-display text-base font-bold uppercase tracking-wide text-fg-1">
            {target.label}
          </span>
        </span>
        <span className="font-mono text-[11.5px] tracking-wide text-fg-3">
          start {formatMetric(target.baseline)}
          {unit} →{" "}
          <span className={toneText(tone)}>
            now {formatMetric(target.current)}
            {unit}
          </span>{" "}
          · goal {formatMetric(target.goal)}
          {unit}
        </span>
      </div>

      {/* Bar is distance travelled from the baseline; the marker at the far end
          is the goal, so the bar reaching it is the goal being met. */}
      <div className="well relative h-2 bg-surface-dark">
        <span
          className={cn("absolute inset-y-0 left-0", toneFill(tone))}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute -inset-y-[3px] right-0 w-0.5 bg-fg-1" aria-hidden />
      </div>

      <div className="mt-3 grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
        <span className="text-[13.5px] text-fg-2">
          {target.achieved
            ? "Cleared the goal inside the window."
            : `${pct}% of the way from where the plan started.`}
        </span>
        <span
          className={cn(
            "text-left font-mono text-[11px] uppercase tracking-wide sm:text-right",
            toneText(tone)
          )}
        >
          {targetDelta(target)}
        </span>
      </div>
    </div>
  );
}

export function PlanTargets({ targets, planEnded }: PlanTargetsProps): React.JSX.Element {
  return (
    <section className="notch border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line-1 px-5 py-3">
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
          {"// TARGETS"}
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-fg-4">
          Marker = goal · bar = where you are
        </span>
      </div>
      {targets.length === 0 ? (
        <p className="px-5 py-6 text-sm text-text-muted">This plan has no targets.</p>
      ) : (
        targets.map((target) => (
          <TargetRow key={target.metric} target={target} planEnded={planEnded} />
        ))
      )}
    </section>
  );
}
