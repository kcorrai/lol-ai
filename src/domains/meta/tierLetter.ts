// op.gg tier (1-5) → conventional letter grade.
//
// Deliberately a leaf module with no imports: client components render tier badges, and pulling
// this from tierListService would drag metaStatsService — and with it the server-only logger and
// `async_hooks` — into the browser bundle.
const TIER_LETTERS: Record<number, string> = { 1: "S", 2: "A", 3: "B", 4: "C", 5: "D" };

export function tierLetter(tier: number): string {
  return TIER_LETTERS[tier] ?? "?";
}
