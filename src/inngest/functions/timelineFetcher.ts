import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { captureMatchTimeline } from "@/domains/riot/services/timelineService";

const MAX_MATCHES = 20;
const DELAY_BETWEEN_MS = 1200; // respect ~1 req/s Riot rate limit

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const timelineFetcher = inngest.createFunction(
  {
    id: "timeline-fetcher",
    triggers: [{ event: "timeline/fetch-for-account" }],
    retries: 1,
  },
  async ({ event }: { event: { data: { riotAccountId: string } } }) => {
    const { riotAccountId } = event.data;

    const account = await prisma.riotAccount.findUnique({
      where: { id: riotAccountId },
      select: { puuid: true, region: true },
    });
    if (!account) {
      logger.warn(`[timelineFetcher] RiotAccount ${riotAccountId} not found`);
      return { processed: 0 };
    }

    // Ranked matches still missing either half of the capture.
    //
    // Two conditions, not one, because the halves are scoped differently (ADR-033). Death events
    // are per-account; frames and events are per-match. Keying the work list on death events
    // alone — as it did before — would mean every match already processed for deaths is skipped
    // forever, so the twenty most recent games would never get their frames.
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

    logger.info(`[timelineFetcher] Processing ${participants.length} matches for ${riotAccountId}`);
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
      `[timelineFetcher] Done: ${totalDeaths} deaths, ${totalFrames} frames, ${totalEvents} events across ${fetched} fetched of ${participants.length} matches`
    );
    return { processed: participants.length, fetched, totalDeaths, totalFrames, totalEvents };
  }
);
