"use client";

import { ArrowRight } from "lucide-react";

interface PlanEmptyStateProps {
  onCreate: () => void;
  isPending: boolean;
}

/**
 * The no-plan hero.
 *
 * Carries `data-tour="create-plan"`: the guided first journey routes a new user
 * to /improvement and spotlights this button (guideSteps.ts), so the anchor has
 * to sit on whatever actually generates the plan.
 */
export function PlanEmptyState({ onCreate, isPending }: PlanEmptyStateProps): React.JSX.Element {
  return (
    <div className="grid min-h-[520px] place-items-center">
      <div className="notch-lg bg-hero-fade max-w-[560px] border border-border bg-surface px-10 py-11 text-center">
        <div className="font-mono text-[10.5px] uppercase tracking-label text-acid-500">
          {"// NO ACTIVE PLAN"}
        </div>
        <h2 className="mb-2.5 mt-3.5 font-display text-[28px] font-black uppercase text-fg-1">
          Two weeks, three targets
        </h2>
        <p className="mx-auto mb-6 max-w-[46ch] text-[14.5px] text-fg-2">
          Pulled from your weakest measured areas. You can edit the targets after the plan is
          generated, and progress is read from your games automatically.
        </p>
        <button
          data-tour="create-plan"
          onClick={onCreate}
          disabled={isPending}
          className="notch-sm btn-glow inline-flex items-center gap-2 bg-acid-500 px-7 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink-1000 transition-colors hover:bg-acid-400 disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Start improvement plan"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
