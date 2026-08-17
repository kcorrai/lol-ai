import type { PlayerPerformanceProfile } from "@/domains/analysis";
import type { LeakTag, TrackId } from "@/domains/academy/types";

// Placement reads the player's own last 20 games and answers one question: which track
// should they open? The thresholds below are deliberately forgiving — this is a starting
// point, not a rank estimate, and telling a Gold player to start at Foundations because
// of one bad week is worse than starting them a track too high.

export type PlacementLevel = "foundation" | "core" | "advanced";

export type SignalVerdict = "weak" | "ok" | "strong";

export interface PlacementSignal {
  /** The metric, as a player would name it. */
  label: string;
  value: string;
  verdict: SignalVerdict;
  /** The leak this signal raises when it comes back weak. */
  leak: LeakTag;
}

export interface Placement {
  level: PlacementLevel;
  recommendedTrackId: TrackId;
  gamesAnalyzed: number;
  signals: PlacementSignal[];
  /** Leaks worth teaching to, strongest first. */
  leaks: LeakTag[];
}

interface Threshold {
  label: string;
  leak: LeakTag;
  /** Below `weak` is a leak; at or above `strong` is a strength. */
  weak: number;
  strong: number;
  unit: string;
  /** Set when a lower number is better, e.g. deaths. */
  inverted?: boolean;
}

const THRESHOLDS: Record<string, Threshold> = {
  csPerMinute: { label: "CS / min", leak: "low_cs", weak: 5, strong: 7, unit: "" },
  visionScorePerMinute: {
    label: "Vision / min",
    leak: "low_vision",
    weak: 0.6,
    strong: 1.1,
    unit: "",
  },
  avgDeathsPerGame: {
    label: "Deaths / game",
    leak: "high_deaths",
    weak: 6,
    strong: 4,
    unit: "",
    inverted: true,
  },
  killParticipation: {
    label: "Kill participation",
    leak: "objective_neglect",
    weak: 45,
    strong: 60,
    unit: "%",
  },
};

function judge(value: number, t: Threshold): SignalVerdict {
  if (t.inverted) {
    if (value > t.weak) return "weak";
    return value <= t.strong ? "strong" : "ok";
  }
  if (value < t.weak) return "weak";
  return value >= t.strong ? "strong" : "ok";
}

function formatValue(value: number, t: Threshold): string {
  const decimals = t.weak < 2 ? 2 : 1;
  return `${value.toFixed(decimals)}${t.unit}`;
}

/**
 * Pure placement. Split from the service so it can be tested against a plain profile
 * object rather than a database.
 */
export function placeFromProfile(profile: PlayerPerformanceProfile): Placement {
  const readings: [keyof typeof THRESHOLDS, number][] = [
    ["csPerMinute", profile.avgMetrics.csPerMinute],
    ["visionScorePerMinute", profile.avgMetrics.visionScorePerMinute],
    ["avgDeathsPerGame", profile.avgMetrics.avgDeathsPerGame],
    ["killParticipation", profile.avgMetrics.killParticipation],
  ];

  const signals: PlacementSignal[] = readings.map(([key, value]) => {
    const t = THRESHOLDS[key];
    return { label: t.label, value: formatValue(value, t), verdict: judge(value, t), leak: t.leak };
  });

  const weak = signals.filter((s) => s.verdict === "weak");
  const strong = signals.filter((s) => s.verdict === "strong");

  // Three weak readings out of four is a player who has not got the basics down yet;
  // everything strong means the Foundations track has nothing left to teach them.
  const level: PlacementLevel =
    weak.length >= 3 ? "foundation" : strong.length === signals.length ? "advanced" : "core";

  return {
    level,
    recommendedTrackId: level === "foundation" ? "foundations" : "laning",
    gamesAnalyzed: profile.gamesAnalyzed,
    signals,
    leaks: weak.map((s) => s.leak),
  };
}

/** Where a visitor with no linked account starts: the beginning. */
export const DEFAULT_PLACEMENT: Placement = {
  level: "foundation",
  recommendedTrackId: "foundations",
  gamesAnalyzed: 0,
  signals: [],
  leaks: [],
};
