import { z } from "zod";
import type { Position } from "@/types/common.types";

export type TeamSide = "blue" | "red";

export interface TeamComposition {
  engagePower: number;
  disengagePower: number;
  teamfightPower: number;
  pickPotential: number;
  splitPushPower: number;
  summary: string;
}

export interface WinCondition {
  description: string;
  priority: "primary" | "secondary";
  howToAchieve: string;
}

export interface ScalingProfile {
  earlyGame: { score: number; description: string };
  midGame: { score: number; description: string };
  lateGame: { score: number; description: string };
}

export interface KeyMatchup {
  blue: string;
  red: string;
  advantage: "blue" | "red" | "even";
  note: string;
}

export interface DraftRisk {
  team: TeamSide;
  risk: string;
  severity: "high" | "medium" | "low";
}

export type TeamPicks = Record<Position, string>;

export interface DraftInput {
  blueTeam: TeamPicks;
  redTeam: TeamPicks;
}

export interface DraftAnalysis {
  blueTeam: TeamPicks;
  redTeam: TeamPicks;
  blueTeamComposition: TeamComposition;
  redTeamComposition: TeamComposition;
  blueWinConditions: WinCondition[];
  redWinConditions: WinCondition[];
  blueScaling: ScalingProfile;
  redScaling: ScalingProfile;
  keyMatchups: KeyMatchup[];
  risks: DraftRisk[];
  verdict: string;
  generatedAt: string;
}

const teamCompositionSchema = z.object({
  engagePower: z.number().min(0).max(10),
  disengagePower: z.number().min(0).max(10),
  teamfightPower: z.number().min(0).max(10),
  pickPotential: z.number().min(0).max(10),
  splitPushPower: z.number().min(0).max(10),
  summary: z.string(),
});

const winConditionSchema = z.object({
  description: z.string(),
  priority: z.enum(["primary", "secondary"]),
  howToAchieve: z.string(),
});

const scalingPhaseSchema = z.object({
  score: z.number().min(0).max(10),
  description: z.string(),
});

const scalingProfileSchema = z.object({
  earlyGame: scalingPhaseSchema,
  midGame: scalingPhaseSchema,
  lateGame: scalingPhaseSchema,
});

const keyMatchupSchema = z.object({
  blue: z.string(),
  red: z.string(),
  advantage: z.enum(["blue", "red", "even"]),
  note: z.string(),
});

const draftRiskSchema = z.object({
  team: z.enum(["blue", "red"]),
  risk: z.string(),
  severity: z.enum(["high", "medium", "low"]),
});

export const draftAiOutputSchema = z.object({
  blueTeamComposition: teamCompositionSchema,
  redTeamComposition: teamCompositionSchema,
  blueWinConditions: z.array(winConditionSchema).min(1),
  redWinConditions: z.array(winConditionSchema).min(1),
  blueScaling: scalingProfileSchema,
  redScaling: scalingProfileSchema,
  keyMatchups: z.array(keyMatchupSchema).min(1),
  risks: z.array(draftRiskSchema).min(1),
  verdict: z.string(),
});

export const draftAnalysisSchema = draftAiOutputSchema.extend({
  blueTeam: z.record(z.string(), z.string()),
  redTeam: z.record(z.string(), z.string()),
  generatedAt: z.string(),
});
