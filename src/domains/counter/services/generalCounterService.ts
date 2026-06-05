import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { getAiClient } from "@/lib/ai/client";
import {
  buildCounterSystemPrompt,
  buildCounterUserPrompt,
} from "../prompts/counterPrompt";
import {
  counterAiOutputSchema,
  generalCounterResultSchema,
} from "../types/counter.types";
import type { GeneralCounterResult } from "../types/counter.types";
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

export async function getGeneralCounters(
  champion: string,
  role: Position
): Promise<GeneralCounterResult> {
  const cacheKey = buildCacheKey("counter-general", {
    champion: champion.toLowerCase(),
    role,
  });

  const cached = await getCached(cacheKey);
  if (cached !== null) {
    const cacheResult = generalCounterResultSchema.safeParse(cached);
    if (cacheResult.success) return cacheResult.data;
  }

  const aiClient = getAiClient();
  const response = await aiClient.complete(
    buildCounterSystemPrompt(),
    buildCounterUserPrompt(champion, role)
  );

  let rawParsed: unknown;
  try {
    rawParsed = JSON.parse(extractJson(response.content));
  } catch {
    throw new Error(
      `Counter AI response is not valid JSON. First 200 chars: ${response.content.slice(0, 200)}`
    );
  }

  const aiData = counterAiOutputSchema.parse(rawParsed);

  const result: GeneralCounterResult = {
    champion,
    role,
    topCounters: aiData.topCounters,
    easyCounters: aiData.easyCounters,
    soloQueueCounters: aiData.soloQueueCounters,
    tips: aiData.tips,
    patchNote: aiData.patchNote ?? PATCH_NOTE,
    generatedAt: new Date().toISOString(),
  };

  await setCached(cacheKey, "counter-general", result, 14);
  return result;
}
