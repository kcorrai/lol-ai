import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { fetchAndPersistDeathEvents } from "@/domains/riot/services/timelineService";

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

    // Get ranked matches that haven't had timeline processed yet
    const participants = await prisma.matchParticipant.findMany({
      where: {
        // Match data by puuid so a shared account's matches are all processed (TASK-228); death
        // events stay per-account (each account generates its own).
        puuid: account.puuid,
        match: { queueType: "RANKED_SOLO_5x5" },
        NOT: {
          match: {
            deathEvents: { some: { riotAccountId } },
          },
        },
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

    for (const p of participants) {
      const count = await fetchAndPersistDeathEvents(
        p.match.id,
        p.match.matchId,
        riotAccountId,
        account.puuid,
        account.region,
        p.championName
      );
      totalDeaths += count;
      await sleep(DELAY_BETWEEN_MS);
    }

    logger.info(`[timelineFetcher] Done: ${totalDeaths} deaths stored across ${participants.length} matches`);
    return { processed: participants.length, totalDeaths };
  }
);
