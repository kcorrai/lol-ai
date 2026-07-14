// ── Personal Matchup Intelligence types ──────────────────────────────────────
// Derived from the signed-in user's own ranked match history (see
// personalCounterService). The public, meta-wide counter data lives in the
// `meta` domain instead.

export type MatchupTrend = "improving" | "declining" | "stable" | "insufficient_data";

export interface MatchupEntry {
  opponentChampionId: number;
  opponentChampionName: string;
  games: number;
  wins: number;
  winRate: number;
  avgKda: number;
  trend: MatchupTrend;
}

export interface PersonalMatchupReport {
  championId: number;
  championName: string;
  best: MatchupEntry[];
  worst: MatchupEntry[];
  banSuggestion: MatchupEntry | null;
  totalMatchupsAnalyzed: number;
}
