import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { Errors } from "@/lib/api/errors";
import { isDataStale, invalidateAccountCache } from "@/lib/riot/lifecycle";
import { inngest } from "@/inngest/client";
import { deleteCached, buildCacheKey } from "@/lib/ai/aiCache";
import { getMatchIds, getMatch } from "@/domains/riot/services/riotApiClient";
import { mapMatch } from "@/domains/riot/mappers/matchMapper";
import { refreshChampionStats } from "@/domains/champions/services/championCacheService";
import { refreshChampionMastery } from "@/domains/champions/services/championMasteryService";
import { getPlanLimits } from "@/lib/auth/authorization";
import { indexPlayers, type IndexablePlayer } from "@/domains/riot/services/playerIndexService";
import { enrichParticipantRanks, syncRankedSnapshot } from "@/domains/riot/services/matchSyncRankedService";
export { backfillMatchNicknames } from "@/domains/riot/services/matchSyncRankedService";

export type SyncResult = {
  newMatches: number;
  skipped: number;
  rankedSnapshotted: boolean;
  errors: string[];
};

// Runs syncAccount while managing the account's sync status lifecycle
// (RUNNING → COMPLETED / FAILED). Shared by the durable Inngest worker and the route's in-process
// fallback (TASK-223), so both paths report status identically. Rethrows so Inngest can retry.
export async function runSyncWithStatus(riotAccountId: string, userId: string): Promise<SyncResult> {
  await prisma.riotAccount.update({
    where: { id: riotAccountId },
    data: { syncStatus: "RUNNING", syncStartedAt: new Date(), lastSyncError: null },
  });

  try {
    const result = await syncAccount(riotAccountId, true);

    const account = await prisma.riotAccount.update({
      where: { id: riotAccountId },
      data: { syncStatus: "COMPLETED", syncCompletedAt: new Date() },
      select: { isPrimary: true, gameName: true, tagLine: true },
    });

    if (account.isPrimary) {
      const { ensureProfileSlug } = await import("@/domains/identity/services/profileService");
      ensureProfileSlug(userId, account.gameName, account.tagLine).catch(() => undefined);
    }

    logger.info(`[sync] Completed for ${riotAccountId}: +${result.newMatches} matches`);
    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(`[sync] Failed for ${riotAccountId}: ${errorMsg}`);
    await prisma.riotAccount.update({
      where: { id: riotAccountId },
      data: { syncStatus: "FAILED", lastSyncError: errorMsg },
    });
    throw err;
  }
}

export async function syncAccount(riotAccountId: string, force = false): Promise<SyncResult> {
  let account = await prisma.riotAccount.findUnique({ where: { id: riotAccountId } });
  if (!account) throw Errors.notFound("Riot account");

  if (!force && !isDataStale(account.lastSyncedAt, 5)) {
    return { newMatches: 0, skipped: 0, rankedSnapshotted: false, errors: [] };
  }

  logger.info(`[sync] Starting sync for ${account.gameName}#${account.tagLine}`);

  // ── Match ingestion ────────────────────────────────────────────────────────
  const { matchHistoryDepth } = await getPlanLimits(account.userId);
  const matchIds = await getMatchIds(account.puuid, account.region, matchHistoryDepth);

  const existing = await prisma.match.findMany({
    where: { matchId: { in: matchIds } },
    select: { id: true, matchId: true },
  });
  const existingByRiotId = new Map(existing.map((m) => [m.matchId, m.id]));

  const newMatchIds = matchIds.filter((id) => !existingByRiotId.has(id));
  let newCount = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Every match carries ten Riot IDs, nine of them nobody's connected account. Collected across
  // the whole run and written once at the end, they are what makes player search able to
  // autocomplete without a Riot endpoint that can do it (TASK-308).
  const seenPlayers: IndexablePlayer[] = [];

  for (const riotMatchId of newMatchIds) {
    try {
      const dto = await getMatch(riotMatchId, account.region);
      const { randomUUID } = await import("crypto");
      const matchDbId = randomUUID();
      const mapped = mapMatch(dto, matchDbId, account.puuid, account.id);
      if (!mapped) { skipped++; continue; }

      await prisma.$transaction(async (tx) => {
        await tx.match.create({ data: mapped.match });
        await tx.matchParticipant.createMany({ data: mapped.participants });
      });

      for (const p of mapped.participants) {
        seenPlayers.push({
          puuid: p.puuid,
          gameName: p.gameName ?? null,
          tagLine: p.tagLine ?? null,
          region: account.region,
        });
      }

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

  if (seenPlayers.length > 0) {
    const indexed = await indexPlayers(seenPlayers);
    logger.info(`[sync] Indexed ${indexed} players for search`);
  }

  // Link existing matches to our user's participant.
  //
  // One statement rather than one per match. The per-match version could never do anything the
  // single one cannot: every key in existingByRiotId came from a query already scoped to
  // `matchId: { in: matchIds }`, so its `matchIds.includes` guard was always true, and the where
  // clauses differed only by matchId. What it cost was up to a hundred sequential round trips per
  // sync, nearly all of them matching zero rows — `riotAccountId: null` is satisfiable once per
  // account per match, so after the first successful sync the whole loop was pure waste.
  const knownMatchDbIds = [...existingByRiotId.values()];
  if (knownMatchDbIds.length > 0) {
    await prisma.matchParticipant.updateMany({
      where: { matchId: { in: knownMatchDbIds }, puuid: account.puuid, riotAccountId: null },
      data: { riotAccountId: account.id },
    });
  }

  // Backfill ranks for existing ranked matches missing participant rank data
  try {
    const unrankedMatches = await prisma.match.findMany({
      where: { queueType: "RANKED_SOLO_5x5", participants: { some: { riotAccountId: account.id } }, AND: { participants: { some: { rankTier: null } } } },
      select: { id: true, participants: { select: { puuid: true } } },
      take: 15,
    });
    for (const m of unrankedMatches) {
      await enrichParticipantRanks(m.id, m.participants.map((p) => p.puuid), account.region);
    }
    if (unrankedMatches.length > 0) logger.info(`[sync] Backfilled ranks for ${unrankedMatches.length} existing matches`);
  } catch (err) {
    logger.warn(`[sync] Rank backfill failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── Ranked snapshot ────────────────────────────────────────────────────────
  const { rankedSnapshotted, errors: rankedErrors, updatedAccount } = await syncRankedSnapshot(account);
  account = updatedAccount;
  errors.push(...rankedErrors);

  // ── Finalize ───────────────────────────────────────────────────────────────
  await prisma.riotAccount.update({ where: { id: account.id }, data: { lastSyncedAt: new Date() } });
  await invalidateAccountCache(account.puuid, account.summonerId ?? "", account.region);

  // Mastery is chained rather than fired alongside: it annotates the rows the stats
  // refresh creates, so running the two in parallel would update a set that does not
  // exist yet on a champion played for the first time this session.
  refreshChampionStats(account.id)
    .then(() => refreshChampionMastery(account.id))
    .catch((err) => logger.warn("[sync] Champion cache refresh failed", err));

  if (newCount >= 3) inngest.send({ name: "match/session.synced", data: { riotAccountId: account.id } }).catch((err) => logger.warn("[sync] Failed to fire session.synced event", err));
  inngest.send({ name: "tilt/check-streak", data: { riotAccountId: account.id, userId: account.userId } }).catch((err) => logger.warn("[sync] Failed to fire tilt/check-streak event", err));
  inngest.send({ name: "achievement/check", data: { riotAccountId: account.id, userId: account.userId } }).catch((err) => logger.warn("[sync] Failed to fire achievement/check event", err));
  if (newCount > 0) inngest.send({ name: "timeline/fetch-for-account", data: { riotAccountId: account.id } }).catch((err) => logger.warn("[sync] Failed to fire timeline/fetch-for-account event", err));
  inngest.send({ name: "challenge/check-progress", data: { riotAccountId: account.id, userId: account.userId } }).catch((err) => logger.warn("[sync] Failed to fire challenge/check-progress event", err));
  inngest.send({ name: "snapshot/compute", data: { riotAccountId: account.id } }).catch((err) => logger.warn("[sync] Failed to fire snapshot/compute event", err));
  if (newCount > 0) inngest.send({ name: "academy/check-assignments", data: { riotAccountId: account.id, userId: account.userId } }).catch((err) => logger.warn("[sync] Failed to fire academy/check-assignments event", err));

  if (newCount > 0) {
    const positions = ["all", "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
    await Promise.all(
      positions.map((pos) => deleteCached(buildCacheKey("matchup-matrix", { riotAccountId: account.id, position: pos })))
    ).catch((err) => logger.warn("[sync] Cache bust failed", err));
  }

  logger.info(`[sync] Done: +${newCount} new, ${skipped} skipped, ${errors.length} errors, ranked=${rankedSnapshotted}`);
  if (errors.length > 0) logger.warn(`[sync] First error sample: ${errors[0]}`);

  return { newMatches: newCount, skipped, rankedSnapshotted, errors };
}
