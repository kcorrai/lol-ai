import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { enrichParticipantRanks } from "@/domains/riot/services/matchSyncRankedService";

// One sync's worth of newly ingested matches. A sync tops out at a hundred matches, but a hundred
// enrichments is ten minutes of Riot calls and there is no reader waiting on the tail of it — the
// most recent games are what anyone looks at. Anything past this is picked up by the next run.
const MAX_MATCHES = 25;

/**
 * Stamps participant ranks onto recently ingested matches.
 *
 * This used to be fired unawaited from inside the ingest loop, once per match. Fifty new matches
 * meant fifty of these running at once — up to five hundred Riot requests in flight from a single
 * user pressing sync, competing for the same token bucket as the ingest itself, and none of it
 * tracked. On Vercel, work that is neither awaited nor handed to waitUntil can be killed when the
 * response returns, so the ranks would sometimes simply not arrive; the backfill sweep that used
 * to sit at the end of syncAccount existed to paper over exactly that.
 *
 * As a durable step it gets retries, it cannot be cut off mid-flight, and matches are enriched one
 * at a time so the Riot budget is spent at a rate the limiter was actually configured for.
 */
export const rankEnricher = inngest.createFunction(
  {
    id: "rank-enricher",
    triggers: [{ event: "match/enrich-ranks" }],
    retries: 2,
    // One run per account at a time. Two syncs of the same account otherwise enrich the same
    // matches twice, doubling the Riot spend to write the same rows.
    concurrency: { key: "event.data.riotAccountId", limit: 1 },
  },
  async ({ event }: { event: { data: { riotAccountId: string; region: string } } }) => {
    const { riotAccountId, region } = event.data;

    // Ranked matches this account is in where somebody still has no rank recorded. Bounded by
    // gameStart so the work list is the recent past rather than everything ever ingested.
    const matches = await prisma.match.findMany({
      where: {
        queueType: "RANKED_SOLO_5x5",
        participants: { some: { riotAccountId } },
        AND: { participants: { some: { rankTier: null } } },
      },
      select: { id: true, participants: { select: { puuid: true } } },
      orderBy: { gameStart: "desc" },
      take: MAX_MATCHES,
    });

    if (matches.length === 0) return { enriched: 0 };

    let enriched = 0;
    for (const match of matches) {
      try {
        await enrichParticipantRanks(match.id, match.participants.map((p) => p.puuid), region);
        enriched += 1;
      } catch (err) {
        // One bad match does not cost the rest theirs; the retry will come back for it.
        logger.warn(
          `[rankEnricher] ${match.id} failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    logger.info(`[rankEnricher] Enriched ${enriched}/${matches.length} matches for ${riotAccountId}`);
    return { enriched, considered: matches.length };
  }
);
