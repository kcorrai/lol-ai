import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getMatchTimeline } from "@/domains/riot/services/riotApiClient";

export async function fetchAndPersistDeathEvents(
  matchDbId: string,
  riotMatchId: string,
  riotAccountId: string,
  puuid: string,
  region: string,
  championName: string
): Promise<number> {
  // Dedup: skip if we've already processed this match for this player
  const existing = await prisma.matchDeathEvent.findFirst({
    where: { matchId: matchDbId, riotAccountId },
    select: { id: true },
  });
  if (existing) return 0;

  let timeline: Awaited<ReturnType<typeof getMatchTimeline>>;
  try {
    timeline = await getMatchTimeline(riotMatchId, region);
  } catch (err) {
    logger.warn(`[timeline] Failed to fetch ${riotMatchId}: ${err instanceof Error ? err.message : String(err)}`);
    return 0;
  }

  // Resolve participantId for this player
  const participant = timeline.info.participants.find((p) => p.puuid === puuid);
  if (!participant) {
    logger.warn(`[timeline] PUUID ${puuid.slice(0, 8)}… not found in ${riotMatchId}`);
    return 0;
  }

  const victimId = participant.participantId;
  const deaths: Array<{ matchId: string; riotAccountId: string; positionX: number; positionY: number; gameTimeMs: number; championName: string }> = [];

  for (const frame of timeline.info.frames) {
    for (const event of frame.events) {
      if (event.type !== "CHAMPION_KILL") continue;
      const killEvent = event as Extract<typeof event, { type: "CHAMPION_KILL" }>;
      if (killEvent.victimId !== victimId) continue;
      deaths.push({
        matchId: matchDbId,
        riotAccountId,
        positionX: killEvent.position.x,
        positionY: killEvent.position.y,
        gameTimeMs: killEvent.timestamp,
        championName,
      });
    }
  }

  if (deaths.length === 0) {
    // Player had 0 deaths — insert a sentinel so we don't re-fetch on every request
    await prisma.matchDeathEvent.create({
      data: { matchId: matchDbId, riotAccountId, positionX: -1, positionY: -1, gameTimeMs: 0, championName },
    });
    return 0;
  }

  await prisma.matchDeathEvent.createMany({ data: deaths });
  logger.info(`[timeline] Stored ${deaths.length} deaths for ${riotMatchId}`);
  return deaths.length;
}
