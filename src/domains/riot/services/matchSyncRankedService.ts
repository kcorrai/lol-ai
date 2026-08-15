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

const RANK_TIERS: Record<string, RankTier> = {
  IRON: "IRON", BRONZE: "BRONZE", SILVER: "SILVER", GOLD: "GOLD",
  PLATINUM: "PLATINUM", EMERALD: "EMERALD", DIAMOND: "DIAMOND",
  MASTER: "MASTER", GRANDMASTER: "GRANDMASTER", CHALLENGER: "CHALLENGER",
};

const RANK_DIVISIONS: Record<string, RankDivision> = { I: "I", II: "II", III: "III", IV: "IV" };

// Apex tiers (Master/GM/Challenger) have no division subdivision in Riot's API —
// the rank field is returned as "" but logically maps to "I".
const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

export async function enrichParticipantRanks(matchDbId: string, participantPuuids: string[], region: string): Promise<void> {
  for (const puuid of participantPuuids) {
    try {
      const entries = await getRankedEntriesByPuuidDirect(puuid, region);
      const soloEntry = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
      if (!soloEntry) continue;

      const tier = RANK_TIERS[soloEntry.tier];
      const division: RankDivision | undefined =
        RANK_DIVISIONS[soloEntry.rank] ?? (APEX_TIERS.has(soloEntry.tier) ? "I" : undefined);
      if (!tier || !division) continue;

      await prisma.matchParticipant.updateMany({
        where: { matchId: matchDbId, puuid },
        data: { rankTier: tier, rankDivision: division, rankLp: soloEntry.leaguePoints },
      });
    } catch (err) {
      logger.warn(`[sync] Rank lookup failed for ${puuid.slice(0, 8)}…: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export async function backfillMatchNicknames(matchDbId: string, riotMatchId: string, region: string): Promise<void> {
  try {
    const dto = await getMatch(riotMatchId, region);
    for (const p of dto.info.participants) {
      if (!p.riotIdGameName) continue;
      await prisma.matchParticipant.updateMany({
        where: { matchId: matchDbId, puuid: p.puuid, gameName: null },
        data: { gameName: p.riotIdGameName, tagLine: p.riotIdTagline ?? null },
      });
    }
  } catch (err) {
    logger.warn(`[sync] Nickname backfill failed for ${riotMatchId}: ${err instanceof Error ? err.message : String(err)}`);
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
          data: { summonerId: summoner.id, accountId: summoner.accountId, summonerLevel: summoner.summonerLevel, profileIconId: summoner.profileIconId },
        });
        currentAccount = { ...currentAccount, summonerId: summoner.id };
        logger.info(`[sync] Auto-repaired summonerId for ${currentAccount.gameName}#${currentAccount.tagLine}`);
      } else {
        logger.warn(`[sync] Riot API returned empty summonerId for ${currentAccount.gameName}#${currentAccount.tagLine} — account may use new PUUID-only system`);
      }
    } catch (err) {
      logger.warn(`[sync] Failed to auto-repair summonerId: ${err instanceof Error ? err.message : String(err)}`);
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
    logger.info(`[sync] getRankedEntries returned ${entries.length} entries: ${JSON.stringify(entries.map(e => ({ q: e.queueType, tier: e.tier, rank: e.rank })))}`);

    for (const entry of entries) {
      const tier = RANK_TIERS[entry.tier];
      const division: RankDivision | undefined =
        RANK_DIVISIONS[entry.rank] ?? (APEX_TIERS.has(entry.tier) ? "I" : undefined);
      const queueType =
        entry.queueType === "RANKED_SOLO_5x5" ? ("RANKED_SOLO_5x5" as const)
        : entry.queueType === "RANKED_FLEX_SR" ? ("RANKED_FLEX_SR" as const)
        : null;

      logger.info(`[sync] entry: tier=${entry.tier}→${tier}, rank=${entry.rank}→${division}, queue=${entry.queueType}→${queueType}`);
      if (!tier || !division || !queueType) {
        logger.warn(`[sync] Skipping entry — unmapped value: tier=${entry.tier}, rank=${entry.rank}, queue=${entry.queueType}`);
        continue;
      }

      const lastSnapshot = await getLastRankedSnapshot(currentAccount.id, queueType);
      if (lastSnapshot && lastSnapshot.tier === tier && lastSnapshot.division === division && lastSnapshot.lp === entry.leaguePoints) continue;

      await prisma.rankedHistory.create({
        data: { riotAccountId: currentAccount.id, queueType, tier, division, lp: entry.leaguePoints, wins: entry.wins, losses: entry.losses, hotStreak: entry.hotStreak, inactive: entry.inactive, recordedAt: new Date() },
      });

      if (lastSnapshot) {
        inngest
          .send({ name: "rank/changed", data: { riotAccountId: currentAccount.id, previousTier: lastSnapshot.tier, previousDivision: lastSnapshot.division, previousLp: lastSnapshot.lp, newTier: tier, newDivision: division, newLp: entry.leaguePoints } })
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
