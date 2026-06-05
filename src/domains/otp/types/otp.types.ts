import type { Position } from "@/types/common.types";
import { z } from "zod";

export interface OtpMatchupEntry {
  opponent: string;
  difficulty: "easy" | "medium" | "hard";
  summary: string;
  keyTip: string;
}

export interface BanEntry {
  champion: string;
  priority: 1 | 2 | 3;
  reason: string;
}

export interface OtpPowerSpike {
  trigger: string;
  description: string;
}

export interface OtpAnalysis {
  champion: string;
  role: Position;
  matchupTierList: {
    easy: OtpMatchupEntry[];
    medium: OtpMatchupEntry[];
    hard: OtpMatchupEntry[];
  };
  banPriority: BanEntry[];
  hiddenMechanics: string[];
  powerSpikes: OtpPowerSpike[];
  laneStrategies: string[];
  metaRating: {
    score: number;
    assessment: string;
    reasoning: string;
    patchContext: string;
  };
  generatedAt: string;
}

const otpMatchupEntrySchema = z.object({
  opponent: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  summary: z.string(),
  keyTip: z.string(),
});

const banEntrySchema = z.object({
  champion: z.string(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  reason: z.string(),
});

const otpPowerSpikeSchema = z.object({
  trigger: z.string(),
  description: z.string(),
});

export const otpAiOutputSchema = z.object({
  matchupTierList: z.object({
    easy: z.array(otpMatchupEntrySchema).min(3),
    medium: z.array(otpMatchupEntrySchema).min(3),
    hard: z.array(otpMatchupEntrySchema).min(3),
  }),
  banPriority: z.array(banEntrySchema).min(1).max(3),
  hiddenMechanics: z.array(z.string()).min(2),
  powerSpikes: z.array(otpPowerSpikeSchema).min(3),
  laneStrategies: z.array(z.string()).min(2),
  metaRating: z.object({
    score: z.number().min(1).max(10),
    assessment: z.string(),
    reasoning: z.string(),
    patchContext: z.string(),
  }),
});

export const otpAnalysisSchema = otpAiOutputSchema.extend({
  champion: z.string(),
  role: z.enum(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]),
  generatedAt: z.string(),
});
