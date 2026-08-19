import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getMatchTimeline } from "@/domains/riot/services/riotApiClient";
import { parseFrames, participantPuuids } from "@/domains/riot/timeline/parseFrames";
import { parseEvents } from "@/domains/riot/timeline/parseEvents";

export interface TimelineCaptureResult {
  deaths: number;
  frames: number;
  events: number;
  /** True when nothing had to be fetched, because both halves were already stored. */
  skipped: boolean;
}

const EMPTY: TimelineCaptureResult = { deaths: 0, frames: 0, events: 0, skipped: true };

/**
 * Capture one match's timeline: the account's death events, and the whole per-minute record.
 *
 * The two halves are deduplicated **independently** and against different scopes, because they
 * have different owners. Death events belong to a riot account (`match_death_events` predates
 * ADR-033 and stays as it is); frames and events belong to the match, so a game containing two
 * of our players is captured once rather than twice.
 *
 * That split is also what lets this ship without a backfill: a match already processed for
 * deaths is still missing its frames, and this picks it up on the next pass without re-writing
 * the deaths.
 *
 * One Riot request serves both halves — the payload was already being fetched in full and 95% of
 * it thrown away. Adding the rest costs no additional call (ADR-033).
 */
export async function captureMatchTimeline(
  matchDbId: string,
  riotMatchId: string,
  riotAccountId: string,
  puuid: string,
  region: string,
  championName: string
): Promise<TimelineCaptureResult> {
  const [existingDeaths, existingFrame] = await Promise.all([
    prisma.matchDeathEvent.findFirst({
      where: { matchId: matchDbId, riotAccountId },
      select: { id: true },
    }),
    prisma.matchTimelineFrame.findFirst({ where: { matchId: matchDbId }, select: { id: true } }),
  ]);

  const needDeaths = !existingDeaths;
  const needTimeline = !existingFrame;
  if (!needDeaths && !needTimeline) return EMPTY;

  let timeline: Awaited<ReturnType<typeof getMatchTimeline>>;
  try {
    timeline = await getMatchTimeline(riotMatchId, region);
  } catch (err) {
    logger.warn(
      `[timeline] Failed to fetch ${riotMatchId}: ${err instanceof Error ? err.message : String(err)}`
    );
    return EMPTY;
  }

  const puuids = participantPuuids(timeline);
  const result: TimelineCaptureResult = { deaths: 0, frames: 0, events: 0, skipped: false };

  if (needDeaths) {
    result.deaths = await persistDeathEvents(matchDbId, riotAccountId, puuid, championName, timeline);
  }

  if (needTimeline) {
    const frames = parseFrames(matchDbId, timeline);
    const events = parseEvents(matchDbId, timeline, puuids);

    // skipDuplicates plus the unique on (matchId, participantId, minute) is what makes this
    // idempotent, so a concurrent or repeated run needs no transaction and cannot double-write.
    if (frames.length > 0) {
      await prisma.matchTimelineFrame.createMany({ data: frames, skipDuplicates: true });
    }
    if (events.length > 0) {
      await prisma.matchTimelineEvent.createMany({
        data: events.map((e) => ({ ...e, payload: e.payload as Prisma.InputJsonValue })),
      });
    }

    result.frames = frames.length;
    result.events = events.length;
    logger.info(
      `[timeline] Stored ${frames.length} frames and ${events.length} events for ${riotMatchId}`
    );
  }

  return result;
}

/**
 * The account's own deaths, unchanged from before ADR-033.
 *
 * A deathless game writes a sentinel row rather than nothing, because "no deaths" and "not
 * processed" are otherwise the same state and the match would be re-fetched on every pass.
 */
async function persistDeathEvents(
  matchDbId: string,
  riotAccountId: string,
  puuid: string,
  championName: string,
  timeline: Awaited<ReturnType<typeof getMatchTimeline>>
): Promise<number> {
  const participant = timeline.info.participants.find((p) => p.puuid === puuid);
  if (!participant) {
    logger.warn(`[timeline] PUUID ${puuid.slice(0, 8)}… not found in match ${matchDbId}`);
    return 0;
  }

  const victimId = participant.participantId;
  const deaths: Prisma.MatchDeathEventCreateManyInput[] = [];

  for (const frame of timeline.info.frames) {
    for (const event of frame.events) {
      if (event.type !== "CHAMPION_KILL") continue;
      const kill = event as Extract<typeof event, { type: "CHAMPION_KILL" }>;
      if (kill.victimId !== victimId) continue;
      deaths.push({
        matchId: matchDbId,
        riotAccountId,
        positionX: kill.position.x,
        positionY: kill.position.y,
        gameTimeMs: kill.timestamp,
        championName,
      });
    }
  }

  if (deaths.length === 0) {
    await prisma.matchDeathEvent.create({
      data: { matchId: matchDbId, riotAccountId, positionX: -1, positionY: -1, gameTimeMs: 0, championName },
    });
    return 0;
  }

  await prisma.matchDeathEvent.createMany({ data: deaths });
  logger.info(`[timeline] Stored ${deaths.length} deaths for match ${matchDbId}`);
  return deaths.length;
}
