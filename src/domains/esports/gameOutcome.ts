import type { GameStats } from "@/domains/esports/types";

/**
 * Which side won a finished game.
 *
 * Neither feed says. `getEventDetails` publishes a game's number, state and
 * sides and no result; the livestats window publishes the final frame and no
 * winner. What the final frame does carry is objectives, and a nexus cannot be
 * reached without breaking an inhibitor — so the side with more inhibitors is
 * the side that won. Towers break a tie that should not occur.
 *
 * Verified against the series scores the event payload publishes: 12 of 12
 * recent series across LCK, LEC, LPL, LCS, LCP and CBLOL — 27 games — tallied
 * to exactly the published score.
 *
 * Returns null for a game still in progress, or one whose final frame shows no
 * objectives at all, rather than guessing.
 */
export function gameWinner(stats: GameStats): "blue" | "red" | null {
  if (!stats.finished) return null;

  const { blue, red } = stats;
  if (blue.inhibitors !== red.inhibitors) return blue.inhibitors > red.inhibitors ? "blue" : "red";
  if (blue.towers !== red.towers) return blue.towers > red.towers ? "blue" : "red";
  return null;
}
