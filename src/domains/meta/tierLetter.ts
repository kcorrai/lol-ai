// op.gg tier (1-5) → conventional letter grade.
//
// Deliberately a leaf module with no imports: client components render tier badges, and pulling
// this from tierListService would drag metaStatsService — and with it the server-only logger and
// `async_hooks` — into the browser bundle.
const TIER_LETTERS: Record<number, string> = { 1: "S", 2: "A", 3: "B", 4: "C", 5: "D" };

export function tierLetter(tier: number): string {
  return TIER_LETTERS[tier] ?? "?";
}

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
