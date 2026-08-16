import type { TierListEntry } from "@/domains/meta";

// Presentation helpers for the tier list. Leaf module with no runtime imports: the table and
// podium are client components, and reaching for the meta barrel would drag the server-only
// logger and `async_hooks` into the browser bundle.

const TIER_CHIP: Record<string, string> = {
  S: "border-warning/60 bg-warning/15 text-warning",
  A: "border-accent/60 bg-accent/10 text-accent",
  B: "border-info/60 bg-info/10 text-info",
  C: "border-line-2 bg-surface-2 text-text-body",
  D: "border-danger/50 bg-danger/10 text-danger",
};

/**
 * Chip classes for a tier letter. A tiny sample makes an S/A grade meaningless, so those rows
 * get a grey chip rather than a confident colour.
 */
export function tierChipClass(letter: string, lowConfidence = false): string {
  if (lowConfidence) return "border-border bg-transparent text-text-muted/60";
  return TIER_CHIP[letter] ?? "border-border bg-transparent text-text-muted";
}

/** One line on what a tier means — the group headers down the ranking table. */
export const TIER_NOTE: Record<string, string> = {
  S: "Pick these blind",
  A: "Strong, needs a decent matchup",
  B: "Playable, not the reason you win",
  C: "Situational — bring a reason",
  D: "Off-meta this patch",
};

/** Compact sample-size label: 1234 → "1.2k", 28 → "28". */
export function formatGames(games: number): string {
  return games >= 1000 ? `${(games / 1000).toFixed(1)}k` : String(games);
}

/**
 * Places climbed since last patch. Lower rank number is better, so prev - now.
 * Null when op.gg had no ranking last patch — usually a new or fringe pick.
 */
export function movementOf(entry: TierListEntry): number | null {
  if (!entry.rank || !entry.prevPatchRank) return null;
  return entry.prevPatchRank - entry.rank;
}

/**
 * Where a win rate sits inside the range this list actually spans, as 0-100.
 * Computed from the data rather than a fixed domain — ranked clusters around 50%
 * while ARAM runs far wider, and a shared constant would flatten one of them.
 */
export function winRateScale(entries: TierListEntry[]): (winRate: number) => number {
  const rates = entries.map((e) => e.winRate);
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const span = max - min;
  // A single-entry list (or a dead flat one) has no range to scale against.
  if (!Number.isFinite(span) || span <= 0) return () => 100;
  return (winRate) => Math.max(4, Math.min(100, ((winRate - min) / span) * 100));
}
