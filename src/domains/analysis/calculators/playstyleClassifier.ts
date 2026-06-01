import type { PlaystyleType, PerformanceMetrics } from "@/domains/analysis/types/analysis.types";

// Classify a player's dominant playstyle from their aggregate performance metrics.
// The thresholds are heuristic — calibrated against Gold-tier averages.
export function classifyPlaystyle(
  metrics: PerformanceMetrics,
  dominantPosition: string
): PlaystyleType {
  // Supports are always classified as supportive regardless of other metrics
  if (dominantPosition === "UTILITY") return "supportive";

  const { damageShare, killParticipation, csPerMinute, kda, visionScorePerMinute } = metrics;

  // Aggressive: high damage + high fight presence
  if (damageShare > 0.35 && killParticipation > 0.65) return "aggressive";

  // Farming: CS-focused, low team fight presence
  if (csPerMinute > 7.5 && damageShare < 0.22 && killParticipation < 0.5) return "farming";

  // Supportive: low CS, high vision, high fight presence (roaming support-style)
  if (csPerMinute < 4.5 && visionScorePerMinute > 0.5 && killParticipation > 0.55) {
    return "supportive";
  }

  // Passive: loses fights and doesn't farm well — needs the most coaching
  if (kda < 1.8 && csPerMinute < 5.0 && damageShare < 0.18) return "passive";

  return "balanced";
}
