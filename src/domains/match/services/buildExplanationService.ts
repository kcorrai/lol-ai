import { prisma } from "@/lib/db/prisma";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { getAiClient } from "@/lib/ai/client";
import {
  buildBuildExplanationSystemPrompt,
  buildBuildExplanationUserPrompt,
} from "../prompts/buildExplanationPrompt";
import {
  buildExplanationAiOutputSchema,
  buildExplanationSchema,
} from "../types/buildExplanation.types";
import type { BuildExplanation } from "../types/buildExplanation.types";

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
  const cacheKey = buildCacheKey("build-explanation", { matchId, participantPuuid });

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
    : participant.teamId === 100 ? 200 : 100;

  const enemyChampions = participant.match.participants
    .filter((p) => p.teamId === enemyTeamId)
    .map((p) => p.championName);

  const gameDurationMinutes = Math.round(participant.match.gameDuration / 60);

  const aiClient = getAiClient();
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
      enemyChampions
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

  const result: BuildExplanation = {
    ...aiData,
    generatedAt: new Date().toISOString(),
  };

  await setCached(cacheKey, "build-explanation", result, 30);
  return result;
}
