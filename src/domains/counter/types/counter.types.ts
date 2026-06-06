import type { Position } from "@/types/common.types";
import { z } from "zod";

export interface CounterEntry {
  champion: string;
  difficulty: "easy" | "medium" | "hard";
  reasonWhy: string;
  laneAdvantage: string;
  watchOut: string;
  buildHint: string;
  tier: "S" | "A" | "B" | "C";
  winRate?: number;
  lanePhases?: {
    early: "Strong" | "Even" | "Weak";
    mid: "Strong" | "Even" | "Weak";
    late: "Strong" | "Even" | "Weak";
  };
  commonMistakes?: string[];
  winConditions?: string[];
  runeAdvice?: {
    keystone: string;
    primaryPath: string;
    primaryRunes?: string[];
    secondaryPath: string;
    secondaryRunes?: string[];
    statShards?: [string, string, string];
  };
  keyItems?: string[];
  buildPath?: {
    startingItems: string[];
    firstBack: string[];
    coreItems: string[];
    fullBuild: string[];
    situational?: Record<string, string[]>;
  };
  skillOrder?: {
    order: string[];
    maxOrder: string[];
  };
  difficultyTiers?: {
    beginner: "easy" | "medium" | "hard";
    experienced: "easy" | "medium" | "hard";
    otp: "easy" | "medium" | "hard";
  };
}

export interface GeneralCounterResult {
  champion: string;
  role: Position;
  topCounters: CounterEntry[];
  easyCounters: CounterEntry[];
  soloQueueCounters: CounterEntry[];
  tips: string[];
  generatedAt: string;
  patchNote: string;
}

const lanePhaseEnum = z.enum(["Strong", "Even", "Weak"]);
const diffEnum = z.enum(["easy", "medium", "hard"]);

export const counterEntrySchema = z.object({
  champion: z.string(),
  difficulty: diffEnum,
  reasonWhy: z.string(),
  laneAdvantage: z.string(),
  watchOut: z.string(),
  buildHint: z.string(),
  tier: z.enum(["S", "A", "B", "C"]),
  winRate: z.number().optional(),
  lanePhases: z.object({
    early: lanePhaseEnum,
    mid: lanePhaseEnum,
    late: lanePhaseEnum,
  }).optional(),
  commonMistakes: z.array(z.string()).optional(),
  winConditions: z.array(z.string()).optional(),
  runeAdvice: z.object({
    keystone: z.string(),
    primaryPath: z.string(),
    primaryRunes: z.array(z.string()).optional(),
    secondaryPath: z.string(),
    secondaryRunes: z.array(z.string()).optional(),
    statShards: z.tuple([z.string(), z.string(), z.string()]).optional(),
  }).optional(),
  keyItems: z.array(z.string()).optional(),
  buildPath: z.object({
    startingItems: z.array(z.string()),
    firstBack: z.array(z.string()),
    coreItems: z.array(z.string()),
    fullBuild: z.array(z.string()),
    situational: z.record(z.string(), z.array(z.string())).optional(),
  }).optional(),
  skillOrder: z.object({
    order: z.array(z.string()),
    maxOrder: z.array(z.string()),
  }).optional(),
  difficultyTiers: z.object({
    beginner: diffEnum,
    experienced: diffEnum,
    otp: diffEnum,
  }).optional(),
});

export const counterAiOutputSchema = z.object({
  topCounters: z.array(counterEntrySchema),
  easyCounters: z.array(counterEntrySchema),
  soloQueueCounters: z.array(counterEntrySchema),
  tips: z.array(z.string()),
  patchNote: z.string().optional(),
});

export const generalCounterResultSchema = z.object({
  champion: z.string(),
  role: z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]),
  topCounters: z.array(counterEntrySchema),
  easyCounters: z.array(counterEntrySchema),
  soloQueueCounters: z.array(counterEntrySchema),
  tips: z.array(z.string()),
  generatedAt: z.string(),
  patchNote: z.string(),
});

// ── Personal Matchup Intelligence types ──────────────────────────────────────

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
