"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanWithProgress } from "@/domains/analysis/types/analysis.types";
import { formatWindow } from "./planView";

interface PlanStatusHeroProps {
  plan: PlanWithProgress;
  gamesInWindow: number | null;
  lpChange: number | null;
  onCreate: () => void;
  isPending: boolean;
}

function StatBlock({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}): React.JSX.Element {
  return (
    <div>
      <div className="font-mono text-[9.5px] uppercase tracking-label text-fg-4">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums text-fg-1">
        {value}
        {unit && <span className="ml-1.5 font-mono text-[11px] font-normal text-fg-3">{unit}</span>}
      </div>
    </div>
  );
}

/**
 * One unambiguous state, not "Active" plus "Expired".
 *
 * The old page showed a live-plan widget and an expiry chip that could both be
 * true at once; the band commits to a single reading and colours everything
 * from it.
 */
export function PlanStatusHero({
  plan,
  gamesInWindow,
  lpChange,
  onCreate,
  isPending,
}: PlanStatusHeroProps): React.JSX.Element {
  const hit = plan.targets.filter((t) => t.achieved).length;
  const total = plan.targets.length;
  const ended = plan.status === "expired";
  const missed = plan.targets.filter((t) => !t.achieved);

  const headline = ended
    ? total === 0
      ? "This plan set no targets."
      : hit === total
        ? "Every target hit inside the window."
        : `${hit} of ${total} targets hit. ${missed[0]?.label ?? "One"} is the one that didn't move.`
    : plan.allAchieved
      ? "All targets already cleared. Start the next plan."
      : `${plan.weekLabel} · ${plan.daysLeft} days left on this plan.`;

  // Written out rather than interpolated: Tailwind only emits classes it can
  // read as whole strings in the source.
  const dotClass = ended ? "bg-warning" : "bg-acid-500";
  const labelClass = ended ? "text-warning" : "text-acid-500";

  return (
    <section
      className={cn(
        "notch relative overflow-hidden border",
        ended
          ? "border-warning shadow-[0_0_30px_rgba(255,194,75,0.10)]"
          : "glow-accent-soft border-acid-500"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-surface",
          ended
            ? "bg-gradient-to-b from-warning/10 to-transparent"
            : "bg-gradient-to-b from-acid-500/10 to-transparent"
        )}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-6 px-6 py-5">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <span className={cn("h-[7px] w-[7px] animate-glow-pulse", dotClass)} />
            <span className={cn("font-mono text-[10.5px] uppercase tracking-label", labelClass)}>
              {"// "}
              {ended ? "PLAN ENDED" : "PLAN ACTIVE"} ·{" "}
              {formatWindow(plan.createdAt, plan.expiresAt)}
            </span>
          </div>
          <p className="m-0 max-w-[26ch] font-display text-2xl font-extrabold uppercase leading-[1.16] text-fg-1">
            {headline}
          </p>
          {missed.length > 0 && (
            <p className="mb-0 mt-3.5 max-w-[58ch] text-[14.5px] text-fg-2">
              {missed.map((t) => t.label).join(", ")} still short of goal
              {missed.length === 1 ? "" : "s"}
              {ended ? " — it carries into the next plan." : "."}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={onCreate}
              disabled={isPending}
              className="notch-sm btn-glow inline-flex items-center gap-2 bg-acid-500 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-label text-ink-1000 transition-colors hover:bg-acid-400 disabled:opacity-50"
            >
              {isPending ? "Creating…" : ended ? "Start next plan" : "Restart plan"}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
        <div className="flex gap-7">
          <StatBlock label="Targets hit" value={String(hit)} unit={`of ${total}`} />
          {gamesInWindow !== null && (
            <StatBlock label="Games analysed" value={String(gamesInWindow)} />
          )}
          {lpChange !== null && (
            <StatBlock label="LP change" value={`${lpChange > 0 ? "+" : ""}${lpChange}`} />
          )}
        </div>
      </div>
    </section>
  );
}
