import { prismaReadonly } from "@/lib/db/prismaReadonly";

export type PredictableMetric = "csPerMinute" | "deaths" | "visionScore" | "kda";

export interface ImprovementPrediction {
  metric: PredictableMetric;
  currentValue: number;
  targetValue: number;
  estimatedWinRateDeltaMin: number;
  estimatedWinRateDeltaMax: number;
  confidence: "low" | "medium" | "high";
  note: string;
}

// Empirical coefficients derived from published LoL statistics research.
// Values represent estimated win-rate change per unit improvement.
// These are blended across roles until we have enough per-position data.
// See ADR-006 for methodology and Phase 7 ML upgrade plan.
const COEFFICIENTS: Record<
  PredictableMetric,
  { minPct: number; maxPct: number; unit: string; direction: "increase" | "decrease" }
> = {
  csPerMinute: { minPct: 1.0, maxPct: 2.0, unit: "CS/min", direction: "increase" },
  deaths: { minPct: 2.0, maxPct: 3.0, unit: "deaths/game", direction: "decrease" },
  visionScore: { minPct: 0.1, maxPct: 0.2, unit: "vision score", direction: "increase" },
  kda: { minPct: 1.0, maxPct: 2.0, unit: "KDA", direction: "increase" },
};

function buildPrediction(
  metric: PredictableMetric,
  currentValue: number,
  targetValue: number
): ImprovementPrediction {
  const coeff = COEFFICIENTS[metric];
  const delta = Math.abs(targetValue - currentValue);
  const rawMin = parseFloat((delta * coeff.minPct).toFixed(1));
  const rawMax = parseFloat((delta * coeff.maxPct).toFixed(1));

  // Direction sanity: if the user moves in the wrong direction, return zero
  const isCorrectDirection =
    coeff.direction === "increase" ? targetValue > currentValue : targetValue < currentValue;

  if (!isCorrectDirection || delta < 0.01) {
    return {
      metric,
      currentValue,
      targetValue,
      estimatedWinRateDeltaMin: 0,
      estimatedWinRateDeltaMax: 0,
      confidence: "low",
      note: "Target value must move in the beneficial direction to show a gain.",
    };
  }

  return {
    metric,
    currentValue,
    targetValue,
    estimatedWinRateDeltaMin: rawMin,
    estimatedWinRateDeltaMax: rawMax,
    confidence: "medium",
    note: `Improving your ${coeff.unit} by ${delta.toFixed(1)} is estimated to add +${rawMin}–${rawMax}% win rate. Coefficients are approximate — calibrated per-position ML model coming in Phase 7.`,
  };
}

export async function getImprovementPredictions(
  riotAccountId: string
): Promise<ImprovementPrediction[]> {
  const latest = await prismaReadonly.performanceSnapshot.findFirst({
    where: { riotAccountId },
    orderBy: { periodEnd: "desc" },
    select: {
      winRate: true,
      avgKda: true,
      avgCsPerMinute: true,
      avgVisionScore: true,
      weakestArea: true,
      gamesAnalyzed: true,
    },
  });

  if (!latest || latest.gamesAnalyzed < 10) return [];

  const predictions: ImprovementPrediction[] = [];

  const csPerMin = Number(latest.avgCsPerMinute);
  const deaths = 10 / Math.max(Number(latest.avgKda), 0.1); // approximate deaths from KDA
  const visionScore = Number(latest.avgVisionScore);
  const kda = Number(latest.avgKda);

  // CS/min: suggest improving to the next 1.0 unit milestone
  const csTarget = Math.ceil(csPerMin * 2) / 2 + 0.5; // next 0.5 milestone above current
  predictions.push(buildPrediction("csPerMinute", csPerMin, Math.min(csTarget, csPerMin + 2)));

  // Deaths: suggest reducing by 1
  if (deaths > 3) {
    predictions.push(buildPrediction("deaths", deaths, Math.max(deaths - 1, 1)));
  }

  // Vision score: suggest improving by 5
  if (visionScore < 40) {
    predictions.push(buildPrediction("visionScore", visionScore, visionScore + 5));
  }

  // KDA: suggest improving by 0.5 if below 3.0
  if (kda < 3.0) {
    predictions.push(buildPrediction("kda", kda, kda + 0.5));
  }

  // Sort by estimated max gain descending
  return predictions.sort((a, b) => b.estimatedWinRateDeltaMax - a.estimatedWinRateDeltaMax);
}

// Single-metric prediction — used by coaching report and API route
export function predictImprovementForMetric(
  metric: PredictableMetric,
  currentValue: number,
  targetValue: number
): ImprovementPrediction {
  return buildPrediction(metric, currentValue, targetValue);
}
