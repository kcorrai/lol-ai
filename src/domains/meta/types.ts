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
  overallRank: number; // ordinal rank across all champions this patch
  prevPatchRank: number; // ordinal rank on the previous patch (0 if unknown)
  positions: PositionStats[];
}

export interface MetaSnapshot {
  patch: string; // e.g. "16.13"
  fetchedAt: string; // ISO timestamp
  matchCount?: number; // total ranked games op.gg analyzed this patch
  champions: ChampionMetaStats[];
}

// ── Champion build (from the per-champion+lane detail endpoint) ───────────────

export interface BuildItemSet {
  ids: number[]; // Riot item ids
  games: number;
  winRate: number; // 0-100
}

export interface RuneBuild {
  primaryPageId: number;
  primaryRuneIds: number[]; // keystone + 3 minor runes
  secondaryPageId: number;
  secondaryRuneIds: number[]; // 2 runes
  statShardIds: number[]; // 3 stat shards
  games: number;
  winRate: number; // 0-100
}

export interface GameLengthPoint {
  minutes: number; // bucket lower bound (0, 25, 30, 35, 40)
  winRate: number; // 0-100
}

export interface PatchTrendPoint {
  version: string; // raw Data Dragon version, e.g. "16.13"
  winRate: number; // 0-100
  rank: number;
}

export interface ChampionBuild {
  championId: number;
  runes: RuneBuild | null;
  summonerSpellIds: number[];
  starterItems: BuildItemSet | null;
  coreItems: BuildItemSet | null;
  boots: BuildItemSet | null;
  lateItemOptions: BuildItemSet[]; // top single-item options for later slots
  skillOrder: string[]; // 15-level order, e.g. ["W","Q","E",...]
  skillMaxOrder: string[]; // ability max priority, e.g. ["Q","W","E"]
  gameLengths: GameLengthPoint[];
  trend: PatchTrendPoint[];
}
