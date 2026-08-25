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

  // Every list in the skeleton below shows the shape of one of its elements, and the three
  // matchup buckets have to as well. They used to carry a prose placeholder — "[at least 5
  // easy matchups — …]" — with the card's fields described twenty lines further down, and
  // the model read the skeleton literally: all fifteen matchups came back as strings and
  // `otpAiOutputSchema.parse` threw on every request, so the assistant answered 500 every
  // time it was asked.
  return `Create a comprehensive OTP guide for ${champion} in ${roleLabel}.

Return your response in this exact JSON format:
{
  "matchupTierList": {
    "easy": [
      { "opponent": "champion name", "difficulty": "easy", "summary": "brief summary", "keyTip": "most critical tip" }
    ],
    "medium": [
      { "opponent": "champion name", "difficulty": "medium", "summary": "brief summary", "keyTip": "most critical tip" }
    ],
    "hard": [
      { "opponent": "champion name", "difficulty": "hard", "summary": "brief summary", "keyTip": "most critical tip" }
    ]
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

Give at least 5 matchups in each tier: easy ones where you hold the advantage, medium ones that need attention, and hard ones where you can lose lane.

Return only valid JSON, no additional explanation.`;
}
