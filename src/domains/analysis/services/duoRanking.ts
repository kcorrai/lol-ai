export interface OwnMatchRow {
  matchId: string;
  teamId: number;
  gameStart: Date;
}

export interface TeammateRow {
  matchId: string;
  teamId: number;
  puuid: string;
  gameName: string | null;
  tagLine: string | null;
  won: boolean;
}

export interface DuoCandidate {
  puuid: string;
  gameName: string;
  tagLine: string;
  games: number;
  wins: number;
  winRate: number; // 0-100
  lastPlayedAt: string; // ISO
}

/** Below this a name is just someone autofill put next to you, not a duo. */
export const MIN_SHARED_GAMES = 3;

const pct = (n: number, d: number): number => (d === 0 ? 0 : Math.round((n / d) * 100));

/**
 * Ranks the people the player actually queues with.
 *
 * "Played together" means same match AND same team — an enemy you met ten times is not a duo, and
 * `matchParticipant` stores all ten players per match, so the enemy rows are in this data too.
 *
 * @param ownRows      the player's own participant rows (one per match)
 * @param teammateRows every other participant in those matches, both teams
 */
export function rankTeammates(
  ownRows: OwnMatchRow[],
  teammateRows: TeammateRow[],
  opts: { minGames?: number; limit?: number } = {}
): DuoCandidate[] {
  const minGames = opts.minGames ?? MIN_SHARED_GAMES;
  const ownTeamByMatch = new Map(ownRows.map((r) => [r.matchId, r.teamId]));
  const startByMatch = new Map(ownRows.map((r) => [r.matchId, r.gameStart]));

  const byPuuid = new Map<
    string,
    { gameName: string; tagLine: string; games: number; wins: number; lastPlayed: Date }
  >();

  for (const row of teammateRows) {
    if (ownTeamByMatch.get(row.matchId) !== row.teamId) continue;

    const playedAt = startByMatch.get(row.matchId);
    if (!playedAt) continue;

    const existing = byPuuid.get(row.puuid);
    if (existing) {
      existing.games += 1;
      if (row.won) existing.wins += 1;
      // Nicknames change; the most recent match is the one worth displaying.
      if (playedAt > existing.lastPlayed) {
        existing.lastPlayed = playedAt;
        if (row.gameName) existing.gameName = row.gameName;
        if (row.tagLine) existing.tagLine = row.tagLine;
      }
    } else {
      byPuuid.set(row.puuid, {
        gameName: row.gameName ?? "Unknown",
        tagLine: row.tagLine ?? "???",
        games: 1,
        wins: row.won ? 1 : 0,
        lastPlayed: playedAt,
      });
    }
  }

  return [...byPuuid.entries()]
    .filter(([, v]) => v.games >= minGames)
    .map(([puuid, v]) => ({
      puuid,
      gameName: v.gameName,
      tagLine: v.tagLine,
      games: v.games,
      wins: v.wins,
      winRate: pct(v.wins, v.games),
      lastPlayedAt: v.lastPlayed.toISOString(),
    }))
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate)
    .slice(0, opts.limit ?? 8);
}
