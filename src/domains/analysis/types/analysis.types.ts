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

export type RankUpLevel = "high" | "moderate" | "low";

export interface RankUpComponents {
  lpProximity: number;   // 0–30
  winRate: number;       // 0–35
  trend: number;         // 0–20
  mental: number;        // 0–15
}

export interface RankUpResult {
  score: number;
  level: RankUpLevel;
  estimatedGames: number | null;
  currentLP: number;
  lpToNext: number;
  nextLabel: string;
  recentWinRate: number;
  trend: "improving" | "stable" | "declining";
  components: RankUpComponents;
  message: string;
  atRisk: boolean;
}

export type PlanMetric = "winRate" | "kda" | "csPerMinute" | "visionScore" | "deaths";

export interface ImprovementTarget {
  metric: PlanMetric;
  label: string;
  baseline: number;
  goal: number;
  unit: string;
  direction: "increase" | "decrease";
}

export interface PlanProgress extends ImprovementTarget {
  current: number;
  progress: number;  // 0–1 clamped
  achieved: boolean;
}

export interface PlanWithProgress {
  id: string;
  createdAt: string;
  expiresAt: string;
  daysLeft: number;
  weekLabel: string;  // "Week 1 of 2" | "Week 2 of 2"
  status: "active" | "expired";
  targets: PlanProgress[];
  allAchieved: boolean;
}

export interface FocusItem {
  action: string;
  howTo: string;
  expectedImpact: string;
  timeframe: string;
  reportedAt: string;
}

export interface MetricDelta {
  winRate: number;       // percentage points, e.g. +8.5
  kda: number;
  csPerMinute: number;
  visionScore: number;
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
  delta?: MetricDelta;
}

export interface RankBenchmark {
  tier: string;
  avgCsPerMinute: number;
  avgVisionScore: number;
  avgKda: number;
  avgWinRate: number;
}
