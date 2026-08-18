// How a day (or a week) of quiz results becomes a ranking.
//
// Ranked on efficiency, not tenure. LoLdle has no leaderboard at all; Esportdle
// and Champdle rank on streak length, which measures how long someone has been
// showing up rather than how well they play — a player on day 400 outranks a
// better player on day 12 and nothing they do closes the gap. Fewest guesses is
// a score a newcomer can win on their first day.
//
// Pure, so the ordering can be tested without a database.

export interface PlayerResults {
  userId: string;
  displayName: string;
  profileSlug: string | null;
  /** One entry per solved mode. Unsolved modes are simply absent. */
  solvedGuessCounts: number[];
  /** When the last of those solves landed — the final tiebreak. */
  lastSolvedAt: Date;
}

export interface RankedPlayer {
  rank: number;
  userId: string;
  displayName: string;
  profileSlug: string | null;
  modesSolved: number;
  totalGuesses: number;
}

/**
 * More modes solved wins first, then fewer guesses, then whoever got there
 * earlier.
 *
 * Modes-before-guesses is the order that matters: ranking on guesses alone would
 * put someone who solved one puzzle in two above someone who solved every mode in
 * three each, which is the wrong way round for a game about solving puzzles.
 */
export function rankPlayers(players: readonly PlayerResults[]): RankedPlayer[] {
  const scored = players
    .filter((p) => p.solvedGuessCounts.length > 0)
    .map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      profileSlug: p.profileSlug,
      modesSolved: p.solvedGuessCounts.length,
      totalGuesses: p.solvedGuessCounts.reduce((sum, n) => sum + n, 0),
      lastSolvedAt: p.lastSolvedAt.getTime(),
    }))
    .sort(
      (a, b) =>
        b.modesSolved - a.modesSolved ||
        a.totalGuesses - b.totalGuesses ||
        a.lastSolvedAt - b.lastSolvedAt ||
        a.userId.localeCompare(b.userId)
    );

  // Players who tie on everything that counts share a rank, so the board does not
  // claim a difference between two identical days.
  const out: RankedPlayer[] = [];
  let rank = 0;
  let previous: { modesSolved: number; totalGuesses: number } | null = null;

  scored.forEach((player, index) => {
    const tied =
      previous !== null &&
      previous.modesSolved === player.modesSolved &&
      previous.totalGuesses === player.totalGuesses;
    if (!tied) rank = index + 1;
    previous = { modesSolved: player.modesSolved, totalGuesses: player.totalGuesses };
    // Rebuilt rather than spread: lastSolvedAt is a tiebreak, not something the
    // board should publish about when somebody was at their desk.
    out.push({
      rank,
      userId: player.userId,
      displayName: player.displayName,
      profileSlug: player.profileSlug,
      modesSolved: player.modesSolved,
      totalGuesses: player.totalGuesses,
    });
  });

  return out;
}
