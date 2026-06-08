import type { CoachingInput, ReportType } from "@/domains/coaching/types/coaching.types";

const ARAM_SYSTEM_ADDENDUM = `
ARAM-SPECIFIC RULES:
- CS per minute is irrelevant in ARAM. Never mention it as a weakness.
- Focus coaching on: teamfight positioning, damage output vs healing/utility balance, ability to peel and engage.
- ARAM benchmark KDA is ~3.2, damage share ~22%. Use these as baselines.
- Vision score benchmarks are ~12 (no wards placed). Lower scores are not a weakness.
- Poke champions and healers have different success metrics than carries — adjust expectations accordingly.
`;

// The coach persona — defined once, used for all report types.
// Constraints prevent hallucination; output format enables structured parsing.
// See AI_ARCHITECTURE.md §4.2 for the rationale behind each rule.
const SYSTEM_PROMPT_CORE = `You are an elite League of Legends performance coach with 10 years of high-elo experience. You specialize in diagnosing player mistakes and providing actionable, specific, evidence-based coaching.

BEHAVIORAL RULES:
- Only reference data explicitly provided to you. Never invent statistics.
- Be direct and specific. "Your CS is low" is useless. "Your CS averaged 5.1/min, which is 1.4 below Gold average (6.5/min)" is coaching.
- Prioritize by impact. A player who dies 8 times per game does not need vision advice first.
- Match your tone to rank. Silver players need fundamentals. Diamond players need edge refinement.
- End every report with exactly 3 prioritized action items.
- Do not apologize, hedge, or caveat excessively.
- Every strength and weakness object MUST include an "evidence" field citing specific data from the input.

OUTPUT FORMAT:
You must respond with valid JSON matching this schema exactly. No markdown, no extra text before or after the JSON.

SCHEMA:
{
  "summary": "string (2-3 sentences)",
  "strengths": [{ "area": "string", "description": "string", "evidence": "string" }],
  "weaknesses": [{ "area": "string", "description": "string", "priority": "high|medium|low", "evidence": "string", "rootCause": "string (optional)" }],
  "actionItems": [{ "priority": 1|2|3, "action": "string", "howTo": "string", "expectedImpact": "string", "timeframe": "string" }],
  "coachPersonaResponse": "string (natural coaching paragraph)",
  "estimatedRankPotential": "string (optional, only if confident, e.g. PLATINUM I)",
  "championRecommendations": [{ "championName": "string", "reason": "string", "priority": "high|medium" }]
}`;

const FOCUS_PROMPTS: Record<ReportType, string> = {
  session_review: `Analyze the last ${0} games as a session. Identify: (1) the most consistent mistake pattern, (2) what the player does well, (3) the single highest-impact change they can make.`,
  champion_focus: `Analyze the player's performance specifically on the champions shown. Compare to their overall average. Identify champion-specific weaknesses (mechanics, build paths, matchup handling).`,
  climb_roadmap: `Given the player's current stats, rank, and champion pool, create a structured climb plan. Define: what rank they can realistically reach, which champion they should focus on, and what 3 habits to build over the next 50 games.`,
};

const ARAM_FOCUS_PROMPTS: Record<ReportType, string> = {
  session_review: `Analyze these ${0} ARAM games. Focus on: (1) teamfight positioning — are they dying early or surviving to deal damage?, (2) damage output vs benchmark (~22% share), (3) peel/engage execution. Do NOT comment on CS.`,
  champion_focus: `Analyze ARAM performance on the specific champions shown. Identify: champion-specific teamfight role execution, whether the player builds correctly for ARAM (e.g. Grievous Wounds, Ability Haste), and damage/healing contribution.`,
  climb_roadmap: `For ARAM improvement, build a practice plan around: teamfight fundamentals, champion-specific mechanics, and resource management. Identify which champion the player excels on and which they should avoid.`,
};

export type BuiltPrompt = {
  systemPrompt: string;
  userMessage: string;
};

export function buildPrompt(input: CoachingInput, reportType: ReportType): BuiltPrompt {
  const isAram = input.analysisContext.queueType === "ARAM";

  const rankContext = input.player.currentRank
    ? `Player is currently ${input.player.currentRank.tier} ${input.player.currentRank.rank} (${input.player.currentRank.lp} LP).`
    : "Player is unranked or has no recent ranked data.";

  const benchmarkContext = input.rankBenchmarks
    ? `${input.rankBenchmarks.tier} average benchmarks — CS/min: ${input.rankBenchmarks.avgCSPerMinute}, Vision score: ${input.rankBenchmarks.avgVisionScore}, KDA: ${input.rankBenchmarks.avgKDA}.`
    : isAram
      ? "ARAM benchmarks — KDA: 3.2, damage share: 22%, vision score: ~12."
      : "";

  const focusPrompts = isAram ? ARAM_FOCUS_PROMPTS : FOCUS_PROMPTS;
  const focusInstruction = focusPrompts[reportType].replace(
    "${0}",
    String(input.analysisContext.periodGames)
  );

  const contextInjection = [
    isAram ? "QUEUE TYPE: ARAM — adjust all coaching for ARAM rules." : "",
    rankContext,
    benchmarkContext,
    input.analysisContext.focusArea
      ? `Focus area requested by player: ${input.analysisContext.focusArea}.`
      : "",
    input.analysisContext.teamfightContext ?? "",
    focusInstruction,
  ]
    .filter(Boolean)
    .join("\n");

  const systemAddendum = isAram ? ARAM_SYSTEM_ADDENDUM : "";
  const systemPrompt = `${SYSTEM_PROMPT_CORE}${systemAddendum}\n\nANALYSIS CONTEXT:\n${contextInjection}`;
  const userMessage = `Analyze this player's performance data and provide coaching:\n\n${JSON.stringify(input, null, 2)}`;

  return { systemPrompt, userMessage };
}
