import type { ComparisonRow } from "@/domains/esports/comparison";

/** How far apart the two figures have to be before the chip takes a side. */
const MEANINGFUL_GAP_PERCENT = 5;

export type GapTone = "ahead" | "behind" | "level";

export interface ComparisonBars {
  /** Each side's bar as a share of the longer one, 0–1. */
  proShare: number;
  youShare: number;
  /** "+12%", "−8%"; null when the pro figure is zero and a percentage means nothing. */
  gapLabel: string | null;
  tone: GapTone;
}

/**
 * One comparison row drawn as two bars and a signed gap.
 *
 * Every metric in the comparison is one where more is better, so the sign
 * alone says which way the gap runs. A thin sample never takes a side: the
 * number is still shown, but the chip stays neutral, as the written reading
 * already does.
 */
export function comparisonBars(
  row: Pick<ComparisonRow, "pro" | "you" | "gapPercent">,
  lowSample: boolean
): ComparisonBars {
  const longest = Math.max(row.pro, row.you);
  const share = (value: number): number => (longest > 0 ? Math.max(0, value) / longest : 0);

  const gap = row.gapPercent;
  const rounded = gap === null ? null : Math.round(gap);
  const gapLabel =
    rounded === null
      ? null
      : rounded === 0
        ? "±0%"
        : `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)}%`;

  let tone: GapTone = "level";
  if (!lowSample && gap !== null) {
    if (gap >= MEANINGFUL_GAP_PERCENT) tone = "ahead";
    else if (gap <= -MEANINGFUL_GAP_PERCENT) tone = "behind";
  }

  return { proShare: share(row.pro), youShare: share(row.you), gapLabel, tone };
}
