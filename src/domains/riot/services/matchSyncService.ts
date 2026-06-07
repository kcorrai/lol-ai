import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { Errors } from "@/lib/api/errors";
import { isDataStale, invalidateAccountCache } from "@/lib/riot/lifecycle";
import { inngest } from "@/inngest/client";
import { deleteCached, buildCacheKey } from "@/lib/ai/aiCache";
import {
  getMatchIds,
  getMatch,
  getRankedEntries,
  getRankedEntriesByPuuidDirect,
  getSummonerByPuuid,
} from "@/domains/riot/services/riotApiClient";
import { mapMatch } from "@/domains/riot/mappers/matchMapper";
import { getLastRankedSnapshot } from "@/domains/riot/services/rankedService";
import { refreshChampionStats } from "@/domains/champions/services/championCacheService";
import { getPlanLimits } from "@/lib/auth/authorization";
import type { RankTier, RankDivision } from "@prisma/client";

export type SyncResult = {
  newMatches: number;
  skipped: number;
  rankedSnapshotted: boolean;
  errors: string[];
};

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

const RANK_DIVISIONS: Record<string, RankDivision> = {
  I: "I",
  II: "II",
  III: "III",
  IV: "IV",
};

// Apex tiers (Master/GM/Challenger) have no division subdivision in Riot's API —
// the rank field is returned as "" but logically maps to "I".
const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

// Enrich participants of newly-synced ranked matches with each player's current rank.
// Runs sequentially to avoid bursting the Riot API rate limit (10 concurrent calls
// per match × many matches = guaranteed 429s).
async function enrichParticipantRanks(
  matchDbId: string,
  participantPuuids: string[],
  region: string
): Promise<void> {
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

// Fetches match DTO from Riot API and updates any participants missing gameName/tagLine.
// Fire-and-forget safe — all errors are swallowed.
export async function backfillMatchNicknames(
  matchDbId: string,
  riotMatchId: string,
  region: string
): Promise<void> {
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

export async function syncAccount(riotAccountId: string, force = false): Promise<SyncResult> {
  let account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
  });
  if (!account) throw Errors.notFound("Riot account");

  if (!force && !isDataStale(account.lastSyncedAt, 5)) {
    return { newMatches: 0, skipped: 0, rankedSnapshotted: false, errors: [] };
  }

  logger.info(`[sync] Starting sync for ${account.gameName}#${account.tagLine}`);

  // ── Match ingestion ────────────────────────────────────────────────────────
  const { matchHistoryDepth } = await getPlanLimits(account.userId);
  const matchIds = await getMatchIds(account.puuid, account.region, matchHistoryDepth);

  // Determine which matches are already in the DB
  const existing = await prisma.match.findMany({
    where: { matchId: { in: matchIds } },
    select: { id: true, matchId: true },
  });
  const existingByRiotId = new Map(existing.map((m) => [m.matchId, m.id]));

  const newMatchIds = matchIds.filter((id) => !existingByRiotId.has(id));
  let newCount = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const riotMatchId of newMatchIds) {
    try {
      const dto = await getMatch(riotMatchId, account.region);

      const { randomUUID } = await import("crypto");
      const matchDbId = randomUUID();

      const mapped = mapMatch(dto, matchDbId, account.puuid, account.id);
      if (!mapped) {
        skipped++;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.match.create({ data: mapped.match });
        await tx.matchParticipant.createMany({ data: mapped.participants });
      });

      // Enrich ranked data for all participants in ranked solo matches (non-blocking)
      if (mapped.match.queueType === "RANKED_SOLO_5x5") {
        const puuids = mapped.participants.map((p) => p.puuid);
        enrichParticipantRanks(matchDbId, puuids, account.region).catch((err) =>
          logger.warn(`[sync] Rank enrichment failed for ${riotMatchId}: ${err instanceof Error ? err.message : String(err)}`)
        );
      }

      newCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`[sync] Failed for match ${riotMatchId}: ${msg}`);
      errors.push(`${riotMatchId}: ${msg}`);
    }
  }

  // Matches that existed: ensure our user's participant is linked
  for (const [riotMatchId, dbMatchId] of existingByRiotId) {
    if (!matchIds.includes(riotMatchId)) continue;
    await prisma.matchParticipant.updateMany({
      where: { matchId: dbMatchId, puuid: account.puuid, riotAccountId: null },
      data: { riotAccountId: account.id },
    });
  }

  // ── Backfill participant ranks for existing matches with missing rank data ──
  // Runs after new match ingestion. Finds up to 15 ranked solo matches for this
  // account that still have participants without rank data, and enriches them.
  try {
    // Find matches where the user participated AND any participant is still missing rank
    const unrankedMatches = await prisma.match.findMany({
      where: {
        queueType: "RANKED_SOLO_5x5",
        participants: {
          some: { riotAccountId: account.id },
        },
        AND: {
          participants: {
            some: { rankTier: null },
          },
        },
      },
      select: { id: true, participants: { select: { puuid: true } } },
      take: 15,
    });

    for (const m of unrankedMatches) {
      const puuids = m.participants.map((p) => p.puuid);
      await enrichParticipantRanks(m.id, puuids, account.region);
    }

    if (unrankedMatches.length > 0) {
      logger.info(`[sync] Backfilled ranks for ${unrankedMatches.length} existing matches`);
    }
  } catch (err) {
    logger.warn(`[sync] Rank backfill failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── Ranked snapshot ────────────────────────────────────────────────────────
  // Auto-repair summonerId if it was missing (e.g. accounts connected before this field was added)
  if (!account.summonerId) {
    try {
      const summoner = await getSummonerByPuuid(account.puuid, account.region);
      if (summoner.id) {
        await prisma.riotAccount.update({
          where: { id: account.id },
          data: {
            summonerId: summoner.id,
            accountId: summoner.accountId,
            summonerLevel: summoner.summonerLevel,
            profileIconId: summoner.profileIconId,
          },
        });
        account = { ...account, summonerId: summoner.id };
        logger.info(`[sync] Auto-repaired summonerId for ${account.gameName}#${account.tagLine}`);
      } else {
        logger.warn(`[sync] Riot API returned empty summonerId for ${account.gameName}#${account.tagLine} — account may use new PUUID-only system`);
      }
    } catch (err) {
      const repairErr = err instanceof Error ? err.message : String(err);
      logger.warn(`[sync] Failed to auto-repair summonerId: ${repairErr}`);
    }
  }

  let rankedSnapshotted = false;
  {
    try {
      const entries = account.summonerId
        ? await getRankedEntries(account.summonerId, account.region)
        : await getRankedEntriesByPuuidDirect(account.puuid, account.region);
      logger.info(`[sync] getRankedEntries returned ${entries.length} entries: ${JSON.stringify(entries.map(e => ({ q: e.queueType, tier: e.tier, rank: e.rank })))}`);
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

        logger.info(`[sync] entry: tier=${entry.tier}→${tier}, rank=${entry.rank}→${division}, queue=${entry.queueType}→${queueType}`);
        if (!tier || !division || !queueType) {
          logger.warn(`[sync] Skipping entry — unmapped value: tier=${entry.tier}, rank=${entry.rank}, queue=${entry.queueType}`);
          continue;
        }

        const lastSnapshot = await getLastRankedSnapshot(account.id, queueType);
        if (
          lastSnapshot &&
          lastSnapshot.tier === tier &&
          lastSnapshot.division === division &&
          lastSnapshot.lp === entry.leaguePoints
        ) {
          continue;
        }

        await prisma.rankedHistory.create({
          data: {
            riotAccountId: account.id,
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
                riotAccountId: account.id,
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
      rankedSnapshotted = true;
    } catch (err) {
      const msg = `Ranked sync failed: ${err instanceof Error ? err.message : String(err)}`;
      logger.warn(`[sync] ${msg}`);
      errors.push(msg);
    }
  }

  // ── Finalize ───────────────────────────────────────────────────────────────
  await prisma.riotAccount.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });

  await invalidateAccountCache(account.puuid, account.summonerId ?? "", account.region);

  // Refresh pre-computed champion stats cache (non-blocking — failure doesn't abort sync)
  refreshChampionStats(account.id).catch((err) =>
    logger.warn("[sync] Champion cache refresh failed", err)
  );

  // Auto session review: fire event when 3+ new matches detected (non-blocking)
  if (newCount >= 3) {
    inngest
      .send({ name: "match/session.synced", data: { riotAccountId: account.id } })
      .catch((err) => logger.warn("[sync] Failed to fire session.synced event", err));
  }

  // Tilt streak check: fire after every sync so the streak detector can evaluate
  inngest
    .send({
      name: "tilt/check-streak",
      data: { riotAccountId: account.id, userId: account.userId },
    })
    .catch((err) => logger.warn("[sync] Failed to fire tilt/check-streak event", err));

  // Achievement check: fire after every sync so new badges are awarded promptly
  inngest
    .send({
      name: "achievement/check",
      data: { riotAccountId: account.id, userId: account.userId },
    })
    .catch((err) => logger.warn("[sync] Failed to fire achievement/check event", err));

  // Timeline fetch: fire when new matches arrived so death heat map data stays fresh
  if (newCount > 0) {
    inngest
      .send({ name: "timeline/fetch-for-account", data: { riotAccountId: account.id } })
      .catch((err) => logger.warn("[sync] Failed to fire timeline/fetch-for-account event", err));
  }

  // Challenge progress: fire after every sync to keep challenge progress up to date
  inngest
    .send({
      name: "challenge/check-progress",
      data: { riotAccountId: account.id, userId: account.userId },
    })
    .catch((err) => logger.warn("[sync] Failed to fire challenge/check-progress event", err));

  // Bust matchup-matrix cache for all position variants so stale empty results don't persist
  if (newCount > 0) {
    const positions = ["all", "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
    await Promise.all(
      positions.map((pos) =>
        deleteCached(buildCacheKey("matchup-matrix", { riotAccountId: account.id, position: pos }))
      )
    ).catch((err) => logger.warn("[sync] Cache bust failed", err));
  }

  logger.info(
    `[sync] Done: +${newCount} new, ${skipped} skipped, ${errors.length} errors, ranked=${rankedSnapshotted}`
  );
  if (errors.length > 0) {
    logger.warn(`[sync] First error sample: ${errors[0]}`);
  }

  return { newMatches: newCount, skipped, rankedSnapshotted, errors };
}
