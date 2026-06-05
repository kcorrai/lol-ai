import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { getAiClient } from "@/lib/ai/client";
import {
  buildMatchupSystemPrompt,
  buildMatchupUserPrompt,
} from "../prompts/matchupPrompt";
import {
  matchupAiOutputSchema,
  matchupAnalysisSchema,
} from "../types/matchup.types";
import type { MatchupAnalysis } from "../types/matchup.types";
import type { Position } from "@/types/common.types";

const PATCH_NOTE =
  "Bu analiz AI tarafından üretilmiştir. Güncel patch verilerini yansıtmayabilir.";

function extractJson(raw: string): string {
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (codeBlock) return codeBlock[1];
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

export async function getMatchupAnalysis(
  champion: string,
  opponent: string,
  role: Position
): Promise<MatchupAnalysis> {
  if (champion.toLowerCase() === opponent.toLowerCase()) {
    throw new Error("İki farklı şampiyon seçilmelidir");
  }

  const cacheKey = buildCacheKey("matchup", {
    champion: champion.toLowerCase(),
    opponent: opponent.toLowerCase(),
    role,
  });

  const cached = await getCached(cacheKey);
  if (cached !== null) {
    const cacheResult = matchupAnalysisSchema.safeParse(cached);
    if (cacheResult.success) return cacheResult.data;
  }

  const aiClient = getAiClient();
  const response = await aiClient.complete(
    buildMatchupSystemPrompt(),
    buildMatchupUserPrompt(champion, opponent, role)
  );

  let rawParsed: unknown;
  try {
    rawParsed = JSON.parse(extractJson(response.content));
  } catch {
    throw new Error(
      `Matchup AI response is not valid JSON. First 200 chars: ${response.content.slice(0, 200)}`
    );
  }

  const aiData = matchupAiOutputSchema.parse(rawParsed);

  const result: MatchupAnalysis = {
    champion,
    opponent,
    role,
    laneAnalysis: aiData.laneAnalysis,
    tradeGuide: aiData.tradeGuide,
    buildAdvice: aiData.buildAdvice,
    criticalMistakes: aiData.criticalMistakes,
    patchNote: aiData.patchNote ?? PATCH_NOTE,
    generatedAt: new Date().toISOString(),
  };

  await setCached(cacheKey, "matchup", result, 14);
  return result;
}
