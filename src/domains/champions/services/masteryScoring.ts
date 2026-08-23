// Pure mastery scoring math — no DB access. Kept separate from the service so the
// normalization/weighting logic stays unit-testable and the service stays thin.

export type MasteryTier = "Apprentice" | "Adept" | "Expert" | "Master" | "Legend";

export interface MasterySubScores {
  laning: number;
  vision: number;
  teamfight: number;
  objectiveCtrl: number;
  consistency: number;
  carry: number;
}

export interface RawMatch {
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
  visionScore: number;
  objectivesStolen: number;
  turretsDestroyed: number;
  totalTimeCCDealt: number;
  gameDuration: number; // seconds
  won: boolean;
}

// ── Normalize helpers ─────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Maps [min, max] → [0, 100], clamped
function normalize(value: number, min: number, max: number): number {
  return Math.round(clamp((value - min) / (max - min), 0, 1) * 100);
}

// ── Per-dimension calculations ─────────────────────────────────────────────────

export function computeLaning(avgCsPerMinute: number): number {
  // Reference: 3.0 cs/min (very poor) → 9.0 (elite)
  return normalize(avgCsPerMinute, 3.0, 9.0);
}

export function computeVision(avgVisionScore: number): number {
  // Reference: 8 (no effort) → 45 (excellent)
  return normalize(avgVisionScore, 8, 45);
}

export function computeTeamfight(matches: RawMatch[]): number {
  if (matches.length === 0) return 0;

  // Damage share: sum of per-game damage / some target (100k dmg = solid)
  // CC/min: totalTimeCCDealt / gameDurationMin — 0 → 5 range
  const scores = matches.map((m) => {
    const dmgScore = normalize(m.damageDealt, 5_000, 100_000);
    const gameMins = Math.max(m.gameDuration / 60, 1);
    const ccPerMin = m.totalTimeCCDealt / gameMins;
    const ccScore = normalize(ccPerMin, 0, 8);
    return Math.round(dmgScore * 0.7 + ccScore * 0.3);
  });

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function computeObjectiveCtrl(matches: RawMatch[]): number {
  if (matches.length === 0) return 0;

  // objectivesStolen (0-2 typical) + turretsDestroyed (0-5 typical)
  const scores = matches.map((m) => {
    const stolenScore = normalize(m.objectivesStolen, 0, 2);
    const turretScore = normalize(m.turretsDestroyed, 0, 3);
    return Math.round(stolenScore * 0.4 + turretScore * 0.6);
  });

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function computeConsistency(matches: RawMatch[]): number {
  if (matches.length < 3) return 50;

  const kdaValues = matches.map((m) => (m.kills + m.assists) / Math.max(m.deaths, 1));
  const mean = kdaValues.reduce((a, b) => a + b, 0) / kdaValues.length;
  const variance = kdaValues.reduce((s, v) => s + (v - mean) ** 2, 0) / kdaValues.length;
  const stdDev = Math.sqrt(variance);

  // Low std dev = consistent = high score. Range: 0 (perfect) → 3 (very inconsistent)
  return normalize(3 - stdDev, 0, 3);
}

export function computeCarry(avgKda: number): number {
  // Reference: 1.0 (poor) → 6.0 (elite carry)
  return normalize(avgKda, 1.0, 6.0);
}

// ── Composite score ───────────────────────────────────────────────────────────

const WEIGHTS: Record<keyof MasterySubScores, number> = {
  laning: 0.2,
  vision: 0.15,
  teamfight: 0.2,
  objectiveCtrl: 0.15,
  consistency: 0.15,
  carry: 0.15,
};

export function computeTotal(sub: MasterySubScores): number {
  return Math.round(
    sub.laning * WEIGHTS.laning +
      sub.vision * WEIGHTS.vision +
      sub.teamfight * WEIGHTS.teamfight +
      sub.objectiveCtrl * WEIGHTS.objectiveCtrl +
      sub.consistency * WEIGHTS.consistency +
      sub.carry * WEIGHTS.carry
  );
}

export function scoreToTier(total: number): MasteryTier {
  if (total >= 85) return "Legend";
  if (total >= 70) return "Master";
  if (total >= 55) return "Expert";
  if (total >= 40) return "Adept";
  return "Apprentice";
}
