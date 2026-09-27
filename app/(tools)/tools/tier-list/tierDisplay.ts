import type { TierListEntry } from "@/domains/meta";

// Presentation helpers for the tier list. Leaf module with no runtime imports: the table and
// podium are client components, and reaching for the meta barrel would drag the server-only
// logger and `async_hooks` into the browser bundle.

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
