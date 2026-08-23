import type {
  DeathCluster,
  ConsistencyLevel,
  NotableEvent,
} from "@/domains/analysis/types/analysis.types";

// Re-exported rather than redefined: the shared definition lives in lib because five domains use
// it (CLAUDE.md §4). Kept exported from here so the existing callers do not all have to move.
export { computeKDA, kdaRatio } from "@/lib/kda";

export function computeDamageShare(playerDamage: number, teamDamage: number): number {
  if (teamDamage === 0) return 0;
  return parseFloat((playerDamage / teamDamage).toFixed(4));
}

export function computeKillParticipation(
  kills: number,
  assists: number,
  teamKills: number
): number {
  if (teamKills === 0) return 0;
  return parseFloat(((kills + assists) / teamKills).toFixed(4));
}

// Coefficient of variation: std dev / mean. Lower = more consistent.
export function computeConsistency(values: number[]): ConsistencyLevel {
  if (values.length < 2) return "medium";
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return "high";
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const cv = Math.sqrt(variance) / mean;
  if (cv < 0.2) return "high";
  if (cv < 0.4) return "medium";
  return "low";
}

// Estimate when deaths typically happen based on death timer length.
// Death timers scale with game time — longer timers → later deaths.
export function detectDeathCluster(
  avgTimeSpentDeadSeconds: number,
  avgDeaths: number
): DeathCluster {
  if (avgDeaths < 1) return "spread";
  const timePerDeath = avgTimeSpentDeadSeconds / avgDeaths;
  if (timePerDeath < 12) return "early_game";
  if (timePerDeath < 28) return "mid_game";
  return "late_game";
}

export function detectNotableEvents(
  kills: number,
  deaths: number,
  csPerMinute: number,
  visionScore: number,
  firstBlood: boolean,
  position: string,
  won: boolean,
  teamKills: number
): string[] {
  const events: NotableEvent[] = [];

  if (firstBlood) events.push({ type: "first_blood", description: "Secured first blood" });
  if (deaths === 0) events.push({ type: "perfect_kda", description: "Perfect KDA (0 deaths)" });
  if (csPerMinute > 8)
    events.push({ type: "high_cs", description: `Excellent CS: ${csPerMinute}/min` });
  if (visionScore < 10 && position !== "UTILITY") {
    events.push({ type: "poor_vision", description: `Low vision score: ${visionScore}` });
  }
  if (visionScore > 40)
    events.push({ type: "high_vision", description: `Outstanding vision: ${visionScore}` });
  if (won && kills + 0 >= teamKills * 0.4) {
    events.push({ type: "mvp", description: "Dominant contribution to team win" });
  }

  return events.map((e) => e.description);
}

export function identifyStrongestArea(
  avgKda: number,
  avgCsPerMin: number,
  avgVisionScore: number,
  avgDamageShare: number,
  winRate: number
): string {
  const scores: [string, number][] = [
    ["fighting (KDA)", avgKda / 3],
    ["farming (CS)", avgCsPerMin / 7],
    ["vision control", avgVisionScore / 30],
    ["damage output", avgDamageShare / 0.25],
    ["win consistency", winRate / 55],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][0];
}

export function identifyWeakestArea(
  avgKda: number,
  avgCsPerMin: number,
  avgVisionScore: number,
  winRate: number
): string {
  const scores: [string, number][] = [
    ["fighting (KDA)", avgKda / 3],
    ["farming (CS)", avgCsPerMin / 7],
    ["vision control", avgVisionScore / 30],
    ["win consistency", winRate / 55],
  ];
  scores.sort((a, b) => a[1] - b[1]);
  return scores[0][0];
}
