import type { TiltStatus } from "./tiltService";
import type { WarmupData } from "./warmupService";

export type ReadinessLevel = "ready" | "caution" | "not_ready";

export interface ReadinessFactor {
  label: string;
  positive: boolean;
  neutral: boolean;
}

export interface ReadinessResult {
  score: number;
  level: ReadinessLevel;
  factors: ReadinessFactor[];
  advice: string;
}

const ADVICE: Record<ReadinessLevel, string> = {
  ready: "You're dialed in. Good time to climb.",
  caution: "Playable, but monitor your mental — one bad game, take a break.",
  not_ready: "Conditions aren't ideal. Warm up or rest before ranked.",
};

export function computeReadinessScore(tilt: TiltStatus, warmup: WarmupData): ReadinessResult {
  // Tilt component (40 pts)
  const tiltPts = tilt.level === "focused" ? 40 : tilt.level === "caution" ? 20 : 0;

  // Warm-up component (25 pts). no_ranked_today is neutral — don't penalise.
  const warmupPts =
    warmup.status === "warmed_up" ? 25 : warmup.status === "no_ranked_today" ? 15 : 0;

  // Recent win rate component (35 pts). 70 % WR earns the full allocation.
  const winRatePts = Math.round(Math.min(tilt.recentWinRate / 0.7, 1) * 35);

  const score = Math.min(tiltPts + warmupPts + winRatePts, 100);
  const level: ReadinessLevel = score >= 65 ? "ready" : score >= 40 ? "caution" : "not_ready";

  const wrPct = Math.round(tilt.recentWinRate * 100);

  const factors: ReadinessFactor[] = [
    {
      label:
        tilt.level === "focused"
          ? "Mentally focused"
          : tilt.level === "caution"
            ? "Minor tilt risk"
            : "Tilted",
      positive: tilt.level === "focused",
      neutral: tilt.level === "caution",
    },
    {
      label:
        warmup.status === "warmed_up"
          ? "Warmed up"
          : warmup.status === "no_ranked_today"
            ? "Not yet queued"
            : "No warm-up",
      positive: warmup.status === "warmed_up",
      neutral: warmup.status === "no_ranked_today",
    },
    {
      label:
        tilt.recentWinRate >= 0.55
          ? `Good form (${wrPct}% WR)`
          : tilt.recentWinRate >= 0.45
            ? `Average form (${wrPct}% WR)`
            : `Poor form (${wrPct}% WR)`,
      positive: tilt.recentWinRate >= 0.55,
      neutral: tilt.recentWinRate >= 0.45 && tilt.recentWinRate < 0.55,
    },
  ];

  return { score, level, factors, advice: ADVICE[level] };
}
