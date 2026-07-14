// Canonical lane positions used across the app (matches the DB convention).
export type CanonicalPosition = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";

// One head-to-head matchup from the subject champion's perspective.
export interface MatchupEntry {
  opponentId: number; // Riot numeric champion key of the opponent
  games: number; // games in this matchup (sample size)
  subjectWins: number; // games the subject champion won
  subjectWinRate: number; // 0-100, subject champion's win rate vs this opponent
}

// The subject champion's stats in a single lane.
export interface PositionStats {
  position: CanonicalPosition;
  games: number;
  winRate: number; // 0-100
  pickRate: number; // 0-100
  banRate: number; // 0-100
  tier: number; // 1 (best) .. 5 (worst)
  rank: number; // ordinal rank within the position
  counters: MatchupEntry[]; // matchups, sorted by ascending subject win rate (hardest first)
}

export interface ChampionMetaStats {
  championId: number; // Riot numeric key (== op.gg champion_id)
  championKey: string; // Data Dragon id, e.g. "Ahri" (for images/routing)
  name: string; // display name
  overallWinRate: number; // 0-100
  overallPickRate: number; // 0-100
  overallBanRate: number; // 0-100
  overallTier: number; // 1 (best) .. 5 (worst)
  positions: PositionStats[];
}

export interface MetaSnapshot {
  patch: string; // e.g. "16.13"
  fetchedAt: string; // ISO timestamp
  champions: ChampionMetaStats[];
}
