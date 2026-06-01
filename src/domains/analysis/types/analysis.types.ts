export type PlaystyleType = "aggressive" | "farming" | "supportive" | "balanced" | "passive";

export type DeathCluster = "early_game" | "mid_game" | "late_game" | "spread";
export type ConsistencyLevel = "high" | "medium" | "low";

export interface PerformanceMetrics {
  kda: number;
  csPerMinute: number;
  damageShare: number;        // player's damage / team's total damage
  killParticipation: number;  // (kills + assists) / team's total kills
  visionScorePerMinute: number;
  avgGoldPerMinute: number;
  avgDeathsPerGame: number;
}

export interface NotableEvent {
  type: "first_blood" | "perfect_kda" | "high_cs" | "poor_vision" | "high_vision" | "mvp";
  description: string;
}

export interface MatchPerformance {
  matchDbId: string;
  riotMatchId: string;
  champion: string;
  position: string;
  won: boolean;
  gameDurationMinutes: number;
  kills: number;
  deaths: number;
  assists: number;
  csPerMinute: number;
  visionScore: number;
  goldPerMinute: number;
  damageShare: number;
  notableEvents: string[];
}

export interface PlayerPerformanceProfile {
  riotAccountId: string;
  gamesAnalyzed: number;
  avgMetrics: PerformanceMetrics;
  playstyle: PlaystyleType;
  strongestArea: string;
  weakestArea: string;
  recentMatches: MatchPerformance[];
  winRate: number;
  deathCluster: DeathCluster;
  csConsistency: ConsistencyLevel;
  visionConsistency: ConsistencyLevel;
  mostPlayedChampions: string[];
}

export interface RankBenchmark {
  tier: string;
  avgCsPerMinute: number;
  avgVisionScore: number;
  avgKda: number;
  avgWinRate: number;
}
