import type { ReportType } from "@prisma/client";

// Matches the CoachingInput schema defined in AI_ARCHITECTURE.md §3.2 exactly.
// Any change here must be reflected in the prompt builder and AI provider.

export interface CoachingInput {
  player: {
    riotId: string;
    region: string;
    currentRank: { tier: string; rank: string; lp: number } | null;
    roles: string[];
  };
  analysisContext: {
    periodGames: number;
    queueType: string;
    focusArea?: string;
  };
  matches: MatchSummary[];
  aggregateStats: AggregateStats;
  rankBenchmarks: RankBenchmarks | null;
  championPool: ChampionSummary[];
}

export interface MatchSummary {
  matchNumber: number;
  champion: string;
  position: string;
  result: "win" | "loss";
  durationMinutes: number;
  kda: { kills: number; deaths: number; assists: number };
  csPerMinute: number;
  visionScore: number;
  goldPerMinute: number;
  damageShare: number;
  notableEvents: string[];
}

export interface AggregateStats {
  winRate: number;
  avgKDA: number;
  avgCSPerMinute: number;
  avgVisionScore: number;
  avgDeathsPerGame: number;
  deathCluster: "early_game" | "mid_game" | "late_game" | "spread";
  csConsistency: "high" | "medium" | "low";
  visionConsistency: "high" | "medium" | "low";
  mostPlayedChampions: string[];
}

export interface RankBenchmarks {
  tier: string;
  avgCSPerMinute: number;
  avgVisionScore: number;
  avgKDA: number;
  avgWinRate: number;
}

export interface ChampionSummary {
  champion: string;
  gamesPlayed: number;
  winRate: number;
  avgKDA: number;
  avgCSPerMinute: number;
}

// AI output schema — used for validating AI responses in TASK-009
export interface CoachingReportOutput {
  summary: string;
  strengths: Array<{ area: string; description: string; evidence: string }>;
  weaknesses: Array<{
    area: string;
    description: string;
    priority: "high" | "medium" | "low";
    evidence: string;
    rootCause?: string;
  }>;
  actionItems: Array<{
    priority: number; // 1, 2, 3 — exactly 3 items
    action: string;
    howTo: string;
    expectedImpact: string;
    timeframe: string;
  }>;
  coachPersonaResponse: string;
  estimatedRankPotential?: string;
  championRecommendations?: Array<{
    championName: string;
    reason: string;
    priority: "high" | "medium";
  }>;
}

export type { ReportType };
