import type { PlanProgress } from "@/domains/analysis/types/analysis.types";

/**
 * Shared vocabulary for the improvement page's HUD panels.
 *
 * The design states a target three ways at once — a chip, a coloured "now"
 * figure and a delta — and they have to agree. Deriving all three from one
 * `tone` is what stops a target reading "Hit" in green beside a red delta.
 */
export type PlanTone = "good" | "warn" | "bad" | "flat";

const CHIP_CLASS: Record<PlanTone, string> = {
  good: "border-acid-500 bg-acid-500/10 text-acid-500",
  warn: "border-warning bg-warning/10 text-warning",
  bad: "border-danger bg-danger/10 text-danger",
  flat: "border-line-2 text-fg-3",
};

const TEXT_CLASS: Record<PlanTone, string> = {
  good: "text-acid-500",
  warn: "text-warning",
  bad: "text-danger",
  flat: "text-fg-3",
};

const FILL_CLASS: Record<PlanTone, string> = {
  good: "bg-acid-500",
  warn: "bg-warning",
  bad: "bg-danger",
  flat: "bg-line-3",
};

export function chipClass(tone: PlanTone): string {
  return `tag-cut border px-1.5 py-[3px] text-center font-mono text-[9px] font-bold uppercase tracking-label ${CHIP_CLASS[tone]}`;
}

export function toneText(tone: PlanTone): string {
  return TEXT_CLASS[tone];
}

export function toneFill(tone: PlanTone): string {
  return FILL_CLASS[tone];
}

/**
 * A target that cleared its goal reads green; one still short reads amber.
 *
 * A running plan's unmet target stays neutral — amber is the colour of a
 * verdict, and there is no verdict until the window closes.
 */
export function targetTone(target: PlanProgress, planEnded: boolean): PlanTone {
  if (target.achieved) return "good";
  return planEnded ? "warn" : "flat";
}

/**
 * What the chip says about a target.
 *
 * A target that has not been reached is only "Missed" once the plan is over —
 * while it is still running the honest word is that it is in progress, which is
 * what stops a day-old plan reading as three failures.
 */
export function targetStatusLabel(target: PlanProgress, planEnded: boolean): string {
  if (target.achieved) return "Hit";
  return planEnded ? "Missed" : "In progress";
}

/** Signed movement from where the plan started, in the target's own unit. */
export function targetDelta(target: PlanProgress): string {
  const moved = target.current - target.baseline;
  const sign = moved > 0 ? "+" : "";
  return `${sign}${formatMetric(moved)} vs start`;
}

/**
 * One decimal floor, two only when the value carries them.
 *
 * These are all rate metrics set in a column, so "4.0" beside "3.6" lines up
 * where "4" would not; a KDA of 3.85 still keeps its second decimal.
 */
export function formatMetric(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded * 10) ? rounded.toFixed(1) : rounded.toFixed(2);
}

export function formatWindow(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const start = new Date(startIso).toLocaleDateString("en-US", opts);
  const end = new Date(endIso).toLocaleDateString("en-US", opts);
  return `${start} – ${end}`;
}
