import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { getAiClient } from "@/lib/ai/client";
import { buildDraftSystemPrompt, buildDraftUserPrompt } from "../prompts/draftPrompt";
import { draftAiOutputSchema, draftAnalysisSchema } from "../types/draft.types";
import type { DraftAnalysis, DraftInput } from "../types/draft.types";

const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;

function validateInput(input: DraftInput): void {
  for (const pos of POSITIONS) {
    if (!input.blueTeam[pos]?.trim()) {
      throw new Error(`Mavi takım ${pos} pozisyonu boş`);
    }
    if (!input.redTeam[pos]?.trim()) {
      throw new Error(`Kırmızı takım ${pos} pozisyonu boş`);
    }
  }

  const all = [
    ...POSITIONS.map((p) => input.blueTeam[p].toLowerCase()),
    ...POSITIONS.map((p) => input.redTeam[p].toLowerCase()),
  ];
  const unique = new Set(all);
  if (unique.size !== all.length) {
    throw new Error("Her şampiyon draft'ta yalnızca bir kez seçilebilir");
  }
}

function extractJson(raw: string): string {
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (codeBlock) return codeBlock[1];
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

export async function analyzeDraft(input: DraftInput): Promise<DraftAnalysis> {
  validateInput(input);

  const allChampions = [
    ...POSITIONS.map((p) => input.blueTeam[p].toLowerCase()),
    ...POSITIONS.map((p) => input.redTeam[p].toLowerCase()),
  ].sort();

  const cacheKey = buildCacheKey("draft", { champions: allChampions.join(",") });

  const cached = await getCached(cacheKey);
  if (cached !== null) {
    const cacheResult = draftAnalysisSchema.safeParse(cached);
    if (cacheResult.success) return cacheResult.data;
  }

  const aiClient = getAiClient();
  const response = await aiClient.complete(
    buildDraftSystemPrompt(),
    buildDraftUserPrompt(input.blueTeam, input.redTeam)
  );

  let rawParsed: unknown;
  try {
    rawParsed = JSON.parse(extractJson(response.content));
  } catch {
    throw new Error(
      `Draft AI response is not valid JSON. First 200 chars: ${response.content.slice(0, 200)}`
    );
  }

  const aiData = draftAiOutputSchema.parse(rawParsed);

  const result: DraftAnalysis = {
    blueTeam: input.blueTeam,
    redTeam: input.redTeam,
    ...aiData,
    generatedAt: new Date().toISOString(),
  };

  await setCached(cacheKey, "draft", result, 7);
  return result;
}
