/**
 * Kills, deaths and assists into one number.
 *
 * Lives in lib rather than in a domain because five of them need it — analysis, match, esports,
 * creator and counter — and CLAUDE.md §4 puts anything crossing two domains here. It was previously
 * reimplemented at six call sites with three different roundings, which is a number the product
 * shows a user through six code paths that could drift apart.
 *
 * Deaths floor at one so a deathless game is a ratio rather than a division by zero. That is the
 * convention every LoL site uses, and it happens to agree with the `deaths > 0 ? … : kills +
 * assists` form some call sites had written out longhand: at zero deaths both give kills + assists.
 */
export function kdaRatio(kills: number, deaths: number, assists: number): number {
  return (kills + assists) / Math.max(deaths, 1);
}

/**
 * The same ratio, rounded for display.
 *
 * Callers that average several KDAs together, or format to their own precision, want `kdaRatio`
 * instead — rounding before either of those does it twice.
 */
export function computeKDA(kills: number, deaths: number, assists: number): number {
  return parseFloat(kdaRatio(kills, deaths, assists).toFixed(2));
}

/**
 * Aggregate KDA over many games: the ratio of the sums, not the mean of each game's ratio.
 *
 * Both because it is what every LoL site means by an aggregate KDA, and because the mean is not
 * robust — one deathless game scores 20+ under the floor above and drags a hundred games with it.
 */
export function aggregateKDA(totalKills: number, totalDeaths: number, totalAssists: number): number {
  return computeKDA(totalKills, totalDeaths, totalAssists);
}
