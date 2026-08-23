import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { inngest } from "@/inngest/client";
import {
  getMatch,
  getRankedEntriesByPuuidDirect,
  getSummonerByPuuid,
} from "@/domains/riot/services/riotApiClient";
import { getLastRankedSnapshot } from "@/domains/riot/services/rankedService";
import type { RankTier, RankDivision, RiotAccount } from "@prisma/client";
import { mapWithConcurrency } from "@/lib/utils/concurrency";
import type { RankedEntryDTO } from "@/domains/riot/types/riot.types";

const RANK_TIERS: Record<string, RankTier> = {
  IRON: "IRON",
  BRONZE: "BRONZE",
  SILVER: "SILVER",
  GOLD: "GOLD",
  PLATINUM: "PLATINUM",
  EMERALD: "EMERALD",
  DIAMOND: "DIAMOND",
  MASTER: "MASTER",
  GRANDMASTER: "GRANDMASTER",
  CHALLENGER: "CHALLENGER",
};

const RANK_DIVISIONS: Record<string, RankDivision> = { I: "I", II: "II", III: "III", IV: "IV" };

// Apex tiers (Master/GM/Challenger) have no division subdivision in Riot's API —
// the rank field is returned as "" but logically maps to "I".
const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

// Five at a time across ten participants. The Riot limiter allows twenty a second and
// getRankedEntriesByPuuidDirect is cached for five minutes per puuid, so repeat players across a
// sync are nearly free; what cost anything was doing the ten strictly one after another.
const RANK_LOOKUP_CONCURRENCY = 5;

type ResolvedRank = { puuid: string; tier: RankTier; division: RankDivision; lp: number };

function resolveRank(puuid: string, entries: RankedEntryDTO[]): ResolvedRank | null {
  const soloEntry = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
  if (!soloEntry) return null;

  const tier = RANK_TIERS[soloEntry.tier];
  const division: RankDivision | undefined =
    RANK_DIVISIONS[soloEntry.rank] ?? (APEX_TIERS.has(soloEntry.tier) ? "I" : undefined);
  if (!tier || !division) return null;

  return { puuid, tier, division, lp: soloEntry.leaguePoints };
}

/**
 * Stamps every participant of one match with the rank they held.
 *
 * Was ten Riot calls and ten writes, strictly in sequence, and was called unawaited once per
 * ingested match — so a fifty-match sync launched fifty of these at once, up to five hundred Riot
 * requests in flight from one user action, all contending with the ingest's own calls at the same
 * token bucket. It is now driven by a durable Inngest step (`match/enrich-ranks`) instead, one
 * match at a time, and the lookups inside it are bounded rather than serial.
 *
 * Writes are grouped by the rank value rather than issued per participant: ten players in a game
 * usually hold three or four distinct ranks between them, so this is three or four statements
 * rather than ten.
 */
export async function enrichParticipantRanks(
  matchDbId: string,
  participantPuuids: string[],
  region: string
): Promise<void> {
  const looked = await mapWithConcurrency(
    participantPuuids,
    RANK_LOOKUP_CONCURRENCY,
    async (puuid): Promise<ResolvedRank | null> => {
      try {
        return resolveRank(puuid, await getRankedEntriesByPuuidDirect(puuid, region));
      } catch (err) {
        // One unreachable player must not cost the other nine their rank.
        logger.warn(
          `[sync] Rank lookup failed for ${puuid.slice(0, 8)}…: ${err instanceof Error ? err.message : String(err)}`
        );
        return null;
      }
    }
  );

  const byRank = new Map<string, { rank: ResolvedRank; puuids: string[] }>();
  for (const r of looked) {
    if (!r) continue;
    const key = `${r.tier}:${r.division}:${r.lp}`;
    const bucket = byRank.get(key);
    if (bucket) bucket.puuids.push(r.puuid);
    else byRank.set(key, { rank: r, puuids: [r.puuid] });
  }

  for (const { rank, puuids } of byRank.values()) {
    await prisma.matchParticipant.updateMany({
      where: { matchId: matchDbId, puuid: { in: puuids } },
      data: { rankTier: rank.tier, rankDivision: rank.division, rankLp: rank.lp },
    });
  }
}

/** Written for a participant Riot itself will not name, so the backfill knows it already asked. */
export const NO_RIOT_NAME = "";

/**
 * Fills in the Riot IDs of a pre-migration match.
 *
 * The `continue` on a missing riotIdGameName used to make this unbounded. Bots, deactivated
 * accounts and older matches come back from Riot with no name at all, so those rows stayed null —
 * and the caller's trigger is "any participant has no name". The condition could therefore never
 * become false: every single view of such a match fetched the whole match DTO from Riot again
 * (getMatch is deliberately uncached) and issued ten writes, for ever, spending a rate-limit token
 * the sync needs.
 *
 * A participant Riot declines to name is now written as NO_RIOT_NAME rather than left null, which
 * is what lets the trigger settle. Readers map it back to null so nothing downstream sees the
 * sentinel.
 */
export async function backfillMatchNicknames(
  matchDbId: string,
  riotMatchId: string,
  region: string
): Promise<void> {
  try {
    const dto = await getMatch(riotMatchId, region);

    // Grouped by the name they get, so this is two statements rather than one per participant.
    const named = dto.info.participants.filter((p) => p.riotIdGameName);
    const unnamed = dto.info.participants.filter((p) => !p.riotIdGameName).map((p) => p.puuid);

    await Promise.all([
      ...named.map((p) =>
        prisma.matchParticipant.updateMany({
          where: { matchId: matchDbId, puuid: p.puuid, gameName: null },
          data: { gameName: p.riotIdGameName, tagLine: p.riotIdTagline ?? null },
        })
      ),
      unnamed.length > 0
        ? prisma.matchParticipant.updateMany({
            where: { matchId: matchDbId, puuid: { in: unnamed }, gameName: null },
            data: { gameName: NO_RIOT_NAME },
          })
        : Promise.resolve(),
    ]);
  } catch (err) {
    logger.warn(
      `[sync] Nickname backfill failed for ${riotMatchId}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function syncRankedSnapshot(
  account: RiotAccount
): Promise<{ rankedSnapshotted: boolean; errors: string[]; updatedAccount: RiotAccount }> {
  let currentAccount = account;
  const errors: string[] = [];

  if (!currentAccount.summonerId) {
    try {
      const summoner = await getSummonerByPuuid(currentAccount.puuid, currentAccount.region);
      if (summoner.id) {
        await prisma.riotAccount.update({
          where: { id: currentAccount.id },
          data: {
            summonerId: summoner.id,
            accountId: summoner.accountId,
            summonerLevel: summoner.summonerLevel,
            profileIconId: summoner.profileIconId,
          },
        });
        currentAccount = { ...currentAccount, summonerId: summoner.id };
        logger.info(
          `[sync] Auto-repaired summonerId for ${currentAccount.gameName}#${currentAccount.tagLine}`
        );
      } else {
        logger.warn(
          `[sync] Riot API returned empty summonerId for ${currentAccount.gameName}#${currentAccount.tagLine} — account may use new PUUID-only system`
        );
      }
    } catch (err) {
      logger.warn(
        `[sync] Failed to auto-repair summonerId: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  try {
    // Always by-puuid, never the stored summonerId. Riot now answers
    // league-v4/entries/by-summoner with 403 Forbidden, so preferring a stored id
    // meant every account that had one — i.e. every account synced before Riot
    // dropped the field — silently stopped producing ranked snapshots.
    // getRankedEntriesByPuuidDirect still falls back to by-summoner internally if
    // the by-puuid call ever fails, so nothing is lost by skipping the branch.
    const entries = await getRankedEntriesByPuuidDirect(
      currentAccount.puuid,
      currentAccount.region
    );
    logger.info(
      `[sync] getRankedEntries returned ${entries.length} entries: ${JSON.stringify(entries.map((e) => ({ q: e.queueType, tier: e.tier, rank: e.rank })))}`
    );

    for (const entry of entries) {
      const tier = RANK_TIERS[entry.tier];
      const division: RankDivision | undefined =
        RANK_DIVISIONS[entry.rank] ?? (APEX_TIERS.has(entry.tier) ? "I" : undefined);
      const queueType =
        entry.queueType === "RANKED_SOLO_5x5"
          ? ("RANKED_SOLO_5x5" as const)
          : entry.queueType === "RANKED_FLEX_SR"
            ? ("RANKED_FLEX_SR" as const)
            : null;

      logger.info(
        `[sync] entry: tier=${entry.tier}→${tier}, rank=${entry.rank}→${division}, queue=${entry.queueType}→${queueType}`
      );
      if (!tier || !division || !queueType) {
        logger.warn(
          `[sync] Skipping entry — unmapped value: tier=${entry.tier}, rank=${entry.rank}, queue=${entry.queueType}`
        );
        continue;
      }

      const lastSnapshot = await getLastRankedSnapshot(currentAccount.id, queueType);
      if (
        lastSnapshot &&
        lastSnapshot.tier === tier &&
        lastSnapshot.division === division &&
        lastSnapshot.lp === entry.leaguePoints
      )
        continue;

      await prisma.rankedHistory.create({
        data: {
          riotAccountId: currentAccount.id,
          queueType,
          tier,
          division,
          lp: entry.leaguePoints,
          wins: entry.wins,
          losses: entry.losses,
          hotStreak: entry.hotStreak,
          inactive: entry.inactive,
          recordedAt: new Date(),
        },
      });

      if (lastSnapshot) {
        inngest
          .send({
            name: "rank/changed",
            data: {
              riotAccountId: currentAccount.id,
              previousTier: lastSnapshot.tier,
              previousDivision: lastSnapshot.division,
              previousLp: lastSnapshot.lp,
              newTier: tier,
              newDivision: division,
              newLp: entry.leaguePoints,
            },
          })
          .catch((err) => logger.warn("[sync] Failed to fire rank/changed event", err));
      }
    }
    return { rankedSnapshotted: true, errors, updatedAccount: currentAccount };
  } catch (err) {
    const msg = `Ranked sync failed: ${err instanceof Error ? err.message : String(err)}`;
    logger.warn(`[sync] ${msg}`);
    return { rankedSnapshotted: false, errors: [msg], updatedAccount: currentAccount };
  }
}
