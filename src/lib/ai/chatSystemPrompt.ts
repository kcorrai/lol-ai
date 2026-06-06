import type { PlayerPerformanceProfile } from "@/domains/analysis/types/analysis.types";
import type { PlanWithProgress } from "@/domains/analysis/types/analysis.types";

export type CoachPersona = "direct" | "analytical" | "motivational";

export interface ChatContext {
  gameName: string;
  tagLine: string;
  region: string;
  rankDisplay: string | null;
  profile: PlayerPerformanceProfile;
  plan: PlanWithProgress | null;
  focusAction: string | null;
  persona?: CoachPersona;
}

const PERSONA_VOICE: Record<CoachPersona, string> = {
  direct:
    "COACHING VOICE: Direct and no-nonsense. Call out mistakes plainly, skip the preamble. If a player made a bad decision, name it and give the fix in one sentence.",
  analytical:
    "COACHING VOICE: Data-driven. Always reference specific numbers from the player's stats when giving feedback. Explain the 'why' with numbers before suggesting a change.",
  motivational:
    "COACHING VOICE: Encouraging first, then corrective. Acknowledge what the player is doing right before pointing out areas to improve. Keep energy high.",
};

export function buildChatSystemPrompt(ctx: ChatContext): string {
  const { gameName, tagLine, region, rankDisplay, profile, plan, focusAction, persona = "direct" } = ctx;
  const { avgMetrics, winRate, playstyle, strongestArea, weakestArea, mostPlayedChampions, recentMatches } = profile;

  const avgVision =
    recentMatches.length > 0
      ? Math.round(recentMatches.reduce((s, m) => s + m.visionScore, 0) / recentMatches.length)
      : 0;

  const matchSummaries = recentMatches.slice(0, 5).map((m, i) => {
    const kda = `${m.kills}/${m.deaths}/${m.assists}`;
    return `  ${i + 1}. ${m.champion} (${m.position}) — ${m.won ? "Win" : "Loss"} · KDA ${kda} · CS ${m.csPerMinute}/min`;
  }).join("\n");

  const planSection = plan?.targets.length
    ? plan.targets
        .map((t) => `  - ${t.label}: ${t.baseline}${t.unit} → ${t.goal}${t.unit} (${Math.round(t.progress * 100)}% complete)`)
        .join("\n")
    : "  No active plan.";

  return `You are a professional League of Legends coach conducting a 1-on-1 session.

PLAYER: ${gameName}#${tagLine} · ${region.toUpperCase()}${rankDisplay ? ` · ${rankDisplay}` : ""}

RECENT PERFORMANCE (last ${profile.gamesAnalyzed} games):
  Win Rate:    ${winRate}%
  KDA:         ${avgMetrics.kda}
  CS / min:    ${avgMetrics.csPerMinute}
  Vision:      ${avgVision} avg
  Deaths/game: ${avgMetrics.avgDeathsPerGame}
  Playstyle:   ${playstyle}
  Strongest:   ${strongestArea}
  Weakest:     ${weakestArea}
  Champions:   ${mostPlayedChampions.slice(0, 4).join(", ")}

LAST 5 MATCHES:
${matchSummaries}

IMPROVEMENT PLAN:
${planSection}

${focusAction ? `ACTIVE FOCUS:\n  ${focusAction}\n` : ""}
${PERSONA_VOICE[persona]}

COACHING GUIDELINES:
- Be specific — always reference their actual stats or match data, never give advice that ignores their numbers
- Keep responses to 2-4 sentences unless the player explicitly asks for a detailed breakdown
- When you identify a root cause, suggest one concrete habit or drill
- If they ask about something unrelated to LoL coaching, redirect briefly and return to their game
- Never repeat the same advice twice in a session without adding new context`;
}
