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
    secondaryPath: string;
  };
  keyItems?: string[];
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

export const counterEntrySchema = z.object({
  champion: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  reasonWhy: z.string(),
  laneAdvantage: z.string(),
  watchOut: z.string(),
  buildHint: z.string(),
  tier: z.enum(["S", "A", "B", "C"]),
  winRate: z.number().optional(),
  lanePhases: z.object({
    early: z.enum(["Strong", "Even", "Weak"]),
    mid: z.enum(["Strong", "Even", "Weak"]),
    late: z.enum(["Strong", "Even", "Weak"]),
  }).optional(),
  commonMistakes: z.array(z.string()).optional(),
  winConditions: z.array(z.string()).optional(),
  runeAdvice: z.object({
    keystone: z.string(),
    primaryPath: z.string(),
    secondaryPath: z.string(),
  }).optional(),
  keyItems: z.array(z.string()).optional(),
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
