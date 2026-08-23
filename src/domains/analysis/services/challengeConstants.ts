export type ChallengeMetric = "cs_per_min" | "deaths" | "vision_score" | "win_streak" | "kda";

export interface ChallengeTemplate {
  xp: number;
  matchCount: number;
  defaultTarget: number;
}

export interface ChallengeWithProgress {
  id: string;
  type: string;
  metric: string;
  targetValue: number;
  description: string;
  xpReward: number;
  validFrom: Date;
  validUntil: Date;
  progress: number;
  completed: boolean;
  completedAt: Date | null;
}

export const XP_PER_LEVEL = 500;
export const WEEKLY_MULTIPLIER = 3;

export const TEMPLATES: Record<ChallengeMetric, ChallengeTemplate> = {
  cs_per_min: { xp: 50, matchCount: 3, defaultTarget: 6.5 },
  deaths: { xp: 60, matchCount: 3, defaultTarget: 4.0 },
  vision_score: { xp: 40, matchCount: 3, defaultTarget: 25.0 },
  win_streak: { xp: 80, matchCount: 3, defaultTarget: 3.0 },
  kda: { xp: 50, matchCount: 3, defaultTarget: 2.5 },
};
