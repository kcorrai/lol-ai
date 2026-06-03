// Frontend-safe type for the full coaching report returned by the API.
// JSON fields (strengths, weaknesses, etc.) are fully typed here rather
// than using Prisma's JsonValue, which is a server-only concern.

export interface CoachingReportDetail {
  id: string;
  riotAccountId: string;
  reportType: "session_review" | "champion_focus" | "climb_roadmap";
  status: "pending" | "processing" | "complete" | "failed";
  matchesAnalyzed: string[];
  summary: string | null;
  strengths: Array<{ area: string; description: string; evidence: string }> | null;
  weaknesses: Array<{
    area: string;
    description: string;
    priority: "high" | "medium" | "low";
    evidence: string;
    rootCause?: string;
  }> | null;
  actionItems: Array<{
    priority: number;
    action: string;
    howTo: string;
    expectedImpact: string;
    timeframe: string;
  }> | null;
  coachPersonaResponse: string | null;
  estimatedRankPotential: string | null;
  championRecommendations: Array<{
    championName: string;
    reason: string;
    priority: "high" | "medium";
  }> | null;
  aiModelUsed: string | null;
  processingTimeMs: number | null;
  userRating: number | null;
  createdAt: string;
  completedAt: string | null;
}
