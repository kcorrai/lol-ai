import { prisma } from "@/lib/db/prisma";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { getAiClient } from "@/lib/ai/client";
import { DDRAGON_VERSION } from "@/lib/ddragon";
import { fetchJsonLastGood } from "@/lib/http/lastGoodJson";
import {
  buildBuildExplanationSystemPrompt,
  buildBuildExplanationUserPrompt,
} from "../prompts/buildExplanationPrompt";
import {
  buildExplanationAiOutputSchema,
  buildExplanationSchema,
} from "../types/buildExplanation.types";
import type { BuildExplanation } from "../types/buildExplanation.types";

let itemDataCache: Record<string, { name: string }> | null = null;

async function fetchItemNames(itemIds: number[]): Promise<Record<number, string>> {
  if (!itemDataCache) {
    const json = await fetchJsonLastGood<{ data: Record<string, { name: string }> }>(
      `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/en_US/item.json`,
      { ttlSeconds: 3600 }
    );
    if (!json) return {};
    itemDataCache = json.data;
  }
  const result: Record<number, string> = {};
  for (const id of itemIds) {
    const entry = itemDataCache[String(id)];
    if (entry) result[id] = entry.name;
  }
  return result;
}

function extractJson(raw: string): string {
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (codeBlock) return codeBlock[1];
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

export async function explainBuild(
  matchId: string,
  participantPuuid: string
): Promise<BuildExplanation> {
  const cacheKey = buildCacheKey("build-explanation-v2", { matchId, participantPuuid });

  const cached = await getCached(cacheKey);
  if (cached !== null) {
    const cacheResult = buildExplanationSchema.safeParse(cached);
    if (cacheResult.success) return cacheResult.data;
  }

  const participant = await prisma.matchParticipant.findFirst({
    where: { matchId, puuid: participantPuuid },
    include: {
      match: {
        include: {
          participants: {
            select: { teamId: true, championName: true },
          },
        },
      },
    },
  });

  if (!participant) {
    throw new Error(`Participant not found: matchId=${matchId} puuid=${participantPuuid}`);
  }

  const enemyTeamId = participant.won
    ? participant.match.winningTeam === participant.teamId
      ? 200 - participant.match.winningTeam + 100
      : participant.match.winningTeam
    : participant.teamId === 100
      ? 200
      : 100;

  const enemyChampions = participant.match.participants
    .filter((p) => p.teamId === enemyTeamId)
    .map((p) => p.championName);

  const gameDurationMinutes = Math.round(participant.match.gameDuration / 60);

  const nonZeroIds = participant.itemIds.filter((id) => id > 0);
  const itemNames = await fetchItemNames(nonZeroIds);

  const aiClient = getAiClient("build-explanation");
  const response = await aiClient.complete(
    buildBuildExplanationSystemPrompt(),
    buildBuildExplanationUserPrompt(
      {
        championName: participant.championName,
        itemIds: participant.itemIds,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        won: participant.won,
        gameDurationMinutes,
      },
      enemyChampions,
      itemNames
    )
  );

  let rawParsed: unknown;
  try {
    rawParsed = JSON.parse(extractJson(response.content));
  } catch {
    throw new Error(
      `Build explanation AI response is not valid JSON. First 200 chars: ${response.content.slice(0, 200)}`
    );
  }

  const aiData = buildExplanationAiOutputSchema.parse(rawParsed);

  // Always use DDragon item names — override whatever the AI returned.
  // Also clamp the items array to exactly the number of non-zero item IDs so
  // the index-based icon ↔ name mapping in the panel never drifts.
  const items = nonZeroIds.map((id, i) => ({
    ...(aiData.items[i] ?? {
      wasGoodChoice: true,
      reasoning: "",
      betterAlternative: null,
      whenToChoose: "",
    }),
    itemName: itemNames[id] ?? aiData.items[i]?.itemName ?? `Item ${id}`,
  }));

  const result: BuildExplanation = {
    ...aiData,
    items,
    generatedAt: new Date().toISOString(),
  };

  await setCached(cacheKey, "build-explanation", result, 30);
  return result;
}
