import { z } from "zod";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { getAiClient } from "@/lib/ai/client";
import {
  buildEnrichmentSystemPrompt,
  buildEnrichmentUserPrompt,
} from "../prompts/counterPrompt";
import type { CounterEntry } from "../types/counter.types";
import type { StaticCounterData } from "../data/staticCounters";
import type { Position } from "@/types/common.types";

const diffEnum = z.enum(["easy", "medium", "hard"]);

const enrichmentEntrySchema = z.object({
  champion: z.string(),
  lanePhases: z.object({
    early: z.enum(["Strong", "Even", "Weak"]),
    mid: z.enum(["Strong", "Even", "Weak"]),
    late: z.enum(["Strong", "Even", "Weak"]),
  }).optional(),
  runeAdvice: z.object({
    keystone: z.string(),
    primaryPath: z.string(),
    primaryRunes: z.array(z.string()).optional(),
    secondaryPath: z.string(),
    secondaryRunes: z.array(z.string()).optional(),
    statShards: z.tuple([z.string(), z.string(), z.string()]).optional(),
  }).optional(),
  keyItems: z.array(z.string()).optional(),
  buildPath: z.object({
    startingItems: z.array(z.string()),
    firstBack: z.array(z.string()),
    coreItems: z.array(z.string()),
    fullBuild: z.array(z.string()),
    situational: z.record(z.string(), z.array(z.string())).optional(),
  }).optional(),
  skillOrder: z.object({
    order: z.array(z.string()),
    maxOrder: z.array(z.string()),
  }).optional(),
  winConditions: z.array(z.string()).optional(),
  commonMistakes: z.array(z.string()).optional(),
  difficultyTiers: z.object({
    beginner: diffEnum,
    experienced: diffEnum,
    otp: diffEnum,
  }).optional(),
});

const enrichmentOutputSchema = z.object({
  enriched: z.array(enrichmentEntrySchema),
});

type EnrichmentEntry = z.infer<typeof enrichmentEntrySchema>;

function extractJson(raw: string): string {
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (codeBlock) return codeBlock[1];
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

function applyEnrichment(
  entries: CounterEntry[],
  enriched: EnrichmentEntry[]
): CounterEntry[] {
  const map = new Map(enriched.map((e) => [e.champion, e]));
  return entries.map((entry) => {
    const extra = map.get(entry.champion);
    if (!extra) return entry;
    return {
      ...entry,
      ...(extra.lanePhases !== undefined && { lanePhases: extra.lanePhases }),
      ...(extra.runeAdvice !== undefined && { runeAdvice: extra.runeAdvice }),
      ...(extra.keyItems !== undefined && { keyItems: extra.keyItems }),
      ...(extra.buildPath !== undefined && { buildPath: extra.buildPath }),
      ...(extra.skillOrder !== undefined && { skillOrder: extra.skillOrder }),
      ...(extra.winConditions !== undefined && { winConditions: extra.winConditions }),
      ...(extra.commonMistakes !== undefined && { commonMistakes: extra.commonMistakes }),
      ...(extra.difficultyTiers !== undefined && { difficultyTiers: extra.difficultyTiers }),
    };
  });
}

export async function getEnrichedStaticCounters(
  champion: string,
  role: Position,
  staticData: StaticCounterData
): Promise<StaticCounterData> {
  const cacheKey = buildCacheKey("counter-enrichment", {
    champion: champion.toLowerCase(),
    role,
  });

  const cached = await getCached(cacheKey);
  if (cached !== null) {
    return cached as StaticCounterData;
  }

  const allEntries = [
    ...staticData.topCounters,
    ...staticData.easyCounters,
    ...staticData.soloQueueCounters,
  ];

  const unique = allEntries.filter(
    (e, i, arr) => arr.findIndex((x) => x.champion === e.champion) === i
  );

  const aiClient = getAiClient();
  const response = await aiClient.complete(
    buildEnrichmentSystemPrompt(),
    buildEnrichmentUserPrompt(champion, role, unique),
    { maxTokens: 6000 }
  );

  let rawParsed: unknown;
  try {
    rawParsed = JSON.parse(extractJson(response.content));
  } catch {
    return staticData;
  }

  const parsed = enrichmentOutputSchema.safeParse(rawParsed);
  if (!parsed.success) return staticData;

  const enrichedData: StaticCounterData = {
    ...staticData,
    topCounters: applyEnrichment(staticData.topCounters, parsed.data.enriched),
    easyCounters: applyEnrichment(staticData.easyCounters, parsed.data.enriched),
    soloQueueCounters: applyEnrichment(staticData.soloQueueCounters, parsed.data.enriched),
  };

  await setCached(cacheKey, "counter-enrichment", enrichedData, 90);
  return enrichedData;
}
