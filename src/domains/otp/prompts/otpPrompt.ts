import type { Position } from "@/types/common.types";

export function buildOtpSystemPrompt(champion: string): string {
  return `You are an OTP coach specialized in ${champion}. You have played this champion for hundreds of hours, knowing every matchup, every hidden mechanic, and every meta shift.

Respond in valid JSON format only. Do not use markdown code blocks, just return a pure JSON object.

Provide deep analysis that only real OTP players would know — not casual overviews.`;
}

const ROLE_LABELS: Record<Position, string> = {
  TOP: "Top Lane",
  JUNGLE: "Jungle",
  MIDDLE: "Mid Lane",
  BOTTOM: "Bot Lane (ADC)",
  UTILITY: "Support",
};

export function buildOtpUserPrompt(champion: string, role: Position): string {
  const roleLabel = ROLE_LABELS[role];

  return `Create a comprehensive OTP guide for ${champion} in ${roleLabel}.

Return your response in this exact JSON format:
{
  "matchupTierList": {
    "easy": [at least 5 easy matchups — low skill requirement, you have the advantage],
    "medium": [at least 5 even matchups — requires attention],
    "hard": [at least 5 hard matchups — you can lose lane]
  },
  "banPriority": [
    { "champion": "name", "priority": 1, "reason": "why ban priority" },
    { "champion": "name", "priority": 2, "reason": "why" },
    { "champion": "name", "priority": 3, "reason": "why" }
  ],
  "hiddenMechanics": [
    "3-5 hidden mechanics or interactions — things casual players don't know"
  ],
  "powerSpikes": [
    { "trigger": "Level 6", "description": "explanation" },
    { "trigger": "Trinity Force", "description": "explanation" }
  ],
  "laneStrategies": [
    "3-5 lane strategy tips"
  ],
  "metaRating": {
    "score": 7,
    "assessment": "Strong / Average / Weak / Broken",
    "reasoning": "why this champion deserves this score in current meta",
    "patchContext": "context of recent patch changes"
  }
}

For each matchup card, fill these fields:
{ "opponent": "champion name", "difficulty": "easy"/"medium"/"hard", "summary": "brief summary", "keyTip": "most critical tip" }

Return only valid JSON, no additional explanation.`;
}
