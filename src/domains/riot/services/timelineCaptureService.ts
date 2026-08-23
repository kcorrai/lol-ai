import { captureMatchTimeline } from "@/domains/riot/services/timelineService";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

// Capturing the timelines an account is missing (ADR-033).
//
// This lived inside the Inngest function until LA-66, which found that the event carrying
// the work is dropped whenever Inngest is unreachable — so on a developer's machine the
// capture had never run once, and the feature it feeds could not be verified at all.
//
// It sits in the domain now for the reason `runSyncWithStatus` does: the Inngest worker is
// the durable way to reach it and the sync's in-process fallback is the other, and both
// have to be the same code or only one of them stays correct.

const MAX_MATCHES = 20;
/** Riot allows roughly a request a second on a development key; this stays under it. */
const DELAY_BETWEEN_MS = 1200;

export interface TimelineCaptureSummary {
  processed: number;
  fetched: number;
  totalDeaths: number;
  totalFrames: number;
  totalEvents: number;
}

const NOTHING: TimelineCaptureSummary = {
  processed: 0,
  fetched: 0,
  totalDeaths: 0,
  totalFrames: 0,
  totalEvents: 0,
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runTimelineCaptureForAccount(
  riotAccountId: string
): Promise<TimelineCaptureSummary> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { puuid: true, region: true },
  });
  if (!account) {
    logger.warn(`[timelineCapture] RiotAccount ${riotAccountId} not found`);
    return NOTHING;
  }

  // Ranked matches still missing either half of the capture.
  //
  // Two conditions, not one, because the halves are scoped differently (ADR-033). Death
  // events are per-account; frames and events are per-match. Keying the work list on death
  // events alone — as it did before — would mean every match already processed for deaths is
  // skipped forever, so the twenty most recent games would never get their frames.
  const participants = await prisma.matchParticipant.findMany({
    where: {
      // Match data by puuid so a shared account's matches are all processed (TASK-228); death
      // events stay per-account (each account generates its own).
      puuid: account.puuid,
      match: { queueType: "RANKED_SOLO_5x5" },
      OR: [
        { match: { deathEvents: { none: { riotAccountId } } } },
        { match: { timelineFrames: { none: {} } } },
      ],
    },
    select: {
      championName: true,
      match: { select: { id: true, matchId: true } },
    },
    orderBy: { match: { gameStart: "desc" } },
    take: MAX_MATCHES,
  });

  logger.info(`[timelineCapture] Processing ${participants.length} matches for ${riotAccountId}`);

  let totalDeaths = 0;
  let totalFrames = 0;
  let totalEvents = 0;
  let fetched = 0;

  for (const p of participants) {
    const result = await captureMatchTimeline(
      p.match.id,
      p.match.matchId,
      riotAccountId,
      account.puuid,
      account.region,
      p.championName
    );
    totalDeaths += result.deaths;
    totalFrames += result.frames;
    totalEvents += result.events;

    // Only a real fetch is worth waiting after. A match that turned out to be fully captured
    // never touched Riot, so pausing for it would spend the budget this loop exists to protect.
    if (result.skipped) continue;
    fetched += 1;
    await sleep(DELAY_BETWEEN_MS);
  }

  logger.info(
    `[timelineCapture] Done: ${totalDeaths} deaths, ${totalFrames} frames, ${totalEvents} events across ${fetched} fetched of ${participants.length} matches`
  );

  return { processed: participants.length, fetched, totalDeaths, totalFrames, totalEvents };
}
