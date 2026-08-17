import type { ChampionPoolEntry } from "@/domains/champions/services/championStatsService";

export type PoolVerdict = "keep" | "watch" | "drop";

/**
 * Keep, watch or drop — decided from the player's own record, nothing else.
 *
 * This is a reading of the table, not a new measurement: the thresholds are
 * stated on the page so a row's chip can always be checked against the win
 * rate printed beside it.
 */
export function verdictFor(entry: ChampionPoolEntry): PoolVerdict {
  if (entry.winRate >= 60) return "keep";
  if (entry.winRate < 45) return "drop";
  return "watch";
}

export const VERDICT_LABEL: Record<PoolVerdict, string> = {
  keep: "Keep",
  watch: "Watch",
  drop: "Drop",
};

export const VERDICT_CHIP: Record<PoolVerdict, string> = {
  keep: "border-acid-500 bg-acid-500/10 text-acid-500",
  watch: "border-warning bg-warning/10 text-warning",
  drop: "border-danger bg-danger/10 text-danger",
};

export const VERDICT_RULE = "Keep ≥60% · Watch 45–59% · Drop <45%";

export interface PoolBand {
  label: string;
  games: number;
  winRate: number;
  tone: "good" | "mid" | "bad";
}

/**
 * The pool split into the three champions carrying it, the next five, and
 * everything else — which is the shape the verdict argues about.
 */
export function poolShape(entries: ChampionPoolEntry[]): PoolBand[] {
  const ranked = [...entries].sort((a, b) => b.winRate - a.winRate);

  const band = (slice: ChampionPoolEntry[], label: string, tone: PoolBand["tone"]): PoolBand => {
    const games = slice.reduce((sum, c) => sum + c.gamesPlayed, 0);
    const wins = slice.reduce((sum, c) => sum + c.wins, 0);
    return { label, games, winRate: games > 0 ? Math.round((wins / games) * 100) : 0, tone };
  };

  const bands: PoolBand[] = [band(ranked.slice(0, 3), "Top 3 champions", "good")];
  if (ranked.length > 3) bands.push(band(ranked.slice(3, 8), "Next 5 champions", "mid"));
  if (ranked.length > 8) {
    bands.push(band(ranked.slice(8), `Other ${ranked.length - 8} champions`, "bad"));
  }
  return bands;
}

/** The one-line reading of the pool, or null when there is too little to say. */
export function poolHeadline(entries: ChampionPoolEntry[]): string | null {
  if (entries.length === 0) return null;
  const keepers = entries.filter((c) => verdictFor(c) === "keep");
  if (entries.length < 4) return "Not enough champions yet to call the shape of your pool.";
  if (keepers.length === 0) return "No champion in your pool is clearing 60%.";
  if (keepers.length <= 3) return `Your pool is too wide. ${keepers.length} champions are carrying you.`;
  return `${keepers.length} champions are above 60%. Pick three and queue them.`;
}
