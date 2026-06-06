import type { Position } from "@/types/common.types";
import { z } from "zod";

export interface PowerSpike {
  level?: number;
  item?: string;
  description: string;
}

export interface TradeScenario {
  scenario: string;
  advantage: "you" | "opponent" | "even";
  tip: string;
}

export interface MatchupAnalysis {
  champion: string;
  opponent: string;
  role: Position;
  difficulty?: number;
  laneAnalysis: {
    advantage: "favorable" | "unfavorable" | "even";
    summary: string;
    levels1to3: string;
    level6Plan: string;
    powerSpikes: PowerSpike[];
    wardingTip?: string;
    waveControl?: string;
  };
  tradeGuide: {
    shortTrade: TradeScenario;
    longTrade: TradeScenario;
    winConditions: string[];
    loseConditions: string[];
    tradeSequence?: { combo: string[]; note: string };
    whenToEngage?: string;
  };
  buildAdvice: {
    startingItems: string[];
    coreItems: string[];
    situationalItems: string[];
    reasoning: string;
    skillOrder?: string[];
    skillOrderNote?: string;
  };
  runeAdvice?: {
    keystone: string;
    primaryPath: string;
    secondaryPath: string;
  };
  criticalMistakes: {
    avoidTrades: string[];
    riskyTimings: string[];
    keyMistakes: string[];
    avoidanceAdvice?: string[];
  };
  generatedAt: string;
  patchNote: string;
}

const powerSpikeSchema = z.object({
  level: z.number().optional(),
  item: z.string().optional(),
  description: z.string(),
});

const tradeScenarioSchema = z.object({
  scenario: z.string(),
  advantage: z.enum(["you", "opponent", "even"]),
  tip: z.string(),
});

export const matchupAiOutputSchema = z.object({
  difficulty: z.number().min(1).max(5).optional(),
  laneAnalysis: z.object({
    advantage: z.enum(["favorable", "unfavorable", "even"]),
    summary: z.string(),
    levels1to3: z.string(),
    level6Plan: z.string(),
    powerSpikes: z.array(powerSpikeSchema),
    wardingTip: z.string().optional(),
    waveControl: z.string().optional(),
  }),
  tradeGuide: z.object({
    shortTrade: tradeScenarioSchema,
    longTrade: tradeScenarioSchema,
    winConditions: z.array(z.string()),
    loseConditions: z.array(z.string()),
    tradeSequence: z.object({
      combo: z.array(z.string()),
      note: z.string(),
    }).optional(),
    whenToEngage: z.string().optional(),
  }),
  buildAdvice: z.object({
    startingItems: z.array(z.string()),
    coreItems: z.array(z.string()),
    situationalItems: z.array(z.string()),
    reasoning: z.string(),
    skillOrder: z.array(z.string()).optional(),
    skillOrderNote: z.string().optional(),
  }),
  runeAdvice: z.object({
    keystone: z.string(),
    primaryPath: z.string(),
    secondaryPath: z.string(),
  }).optional(),
  criticalMistakes: z.object({
    avoidTrades: z.array(z.string()),
    riskyTimings: z.array(z.string()),
    keyMistakes: z.array(z.string()),
    avoidanceAdvice: z.array(z.string()).optional(),
  }),
  patchNote: z.string().optional(),
});

export const matchupAnalysisSchema = matchupAiOutputSchema.extend({
  champion: z.string(),
  opponent: z.string(),
  role: z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]),
  generatedAt: z.string(),
  patchNote: z.string(),
});
