import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { Errors } from "@/lib/api/errors";
import { isDataStale, invalidateAccountCache } from "@/lib/riot/lifecycle";
import { dispatchOrReport, dispatchOrRunInProcess } from "@/lib/inngest/dispatch";
import { deleteCachedMany, buildCacheKey } from "@/lib/ai/aiCache";
import { getMatchIds, getMatch } from "@/domains/riot/services/riotApiClient";
import { mapMatch } from "@/domains/riot/mappers/matchMapper";
import { refreshChampionStats } from "@/domains/champions/services/championCacheService";
import { refreshChampionMastery } from "@/domains/champions/services/championMasteryService";
import { getPlanLimits } from "@/lib/auth/authorization";
import { indexPlayers, type IndexablePlayer } from "@/domains/riot/services/playerIndexService";
import { mapWithConcurrency } from "@/lib/utils/concurrency";
import { syncRankedSnapshot } from "@/domains/riot/services/matchSyncRankedService";
import { runTimelineCaptureForAccount } from "@/domains/riot/services/timelineCaptureService";
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

  // Eight at a time, not one. Each iteration is a Riot round trip plus a short transaction, and
  // done strictly in sequence a hundred of them is well over half a minute of a user watching a
  // spinner — while the limiter directly underneath allows twenty requests a second and sat almost
  // idle. Eight keeps that budget usefully busy without opening a hundred Postgres transactions at
  // once; the ceiling that matters is the connection pool, not the rate limit.
  //
  // Bounded rather than Promise.all deliberately: see mapWithConcurrency.
  const INGEST_CONCURRENCY = 8;

  // `account` is reassigned further down (the ranked snapshot can repair a missing summonerId), so
  // the ingest tasks read from a fixed binding rather than closing over a mutable one.
  const { region, puuid, id: accountId } = account;

  // Each task swallows its own failure, so one unreadable match cannot end the run — the same
  // guarantee the sequential loop gave, kept inside the task rather than around the pool.
  const outcomes = await mapWithConcurrency(newMatchIds, INGEST_CONCURRENCY, async (riotMatchId) => {
    try {
      const dto = await getMatch(riotMatchId, region);
      const matchDbId = randomUUID();
      const mapped = mapMatch(dto, matchDbId, puuid, accountId);
      if (!mapped) return { kind: "skipped" as const };

      await prisma.$transaction(async (tx) => {
        await tx.match.create({ data: mapped.match });
        await tx.matchParticipant.createMany({ data: mapped.participants });
      });

      return { kind: "ingested" as const, participants: mapped.participants };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`[sync] Failed for match ${riotMatchId}: ${msg}`);
      return { kind: "failed" as const, error: `${riotMatchId}: ${msg}` };
    }
  });

  // Folded after the fact rather than mutated from inside the tasks, so the counts do not depend
  // on the order things happened to finish in.
  for (const outcome of outcomes) {
    if (outcome.kind === "skipped") {
      skipped++;
    } else if (outcome.kind === "failed") {
      errors.push(outcome.error);
    } else {
      newCount++;
      for (const p of outcome.participants) {
        seenPlayers.push({
          puuid: p.puuid,
          gameName: p.gameName ?? null,
          tagLine: p.tagLine ?? null,
          region,
        });
      }
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

  // One send, and awaited.
  //
  // These were seven separate calls, each its own HTTP round trip, and none of them awaited. On
  // Vercel a promise that is neither awaited nor handed to waitUntil can be dropped when the
  // response returns, so the durable work these exist to start was silently not always starting —
  // the opposite of what a durable execution layer is for. The SDK takes an array.
  const forNewMatches = newCount > 0;
  const events = [
    { name: "tilt/check-streak", data: { riotAccountId: account.id, userId: account.userId } },
    { name: "achievement/check", data: { riotAccountId: account.id, userId: account.userId } },
    { name: "challenge/check-progress", data: { riotAccountId: account.id, userId: account.userId } },
    { name: "snapshot/compute", data: { riotAccountId: account.id } },
    ...(newCount >= 3
      ? [{ name: "match/session.synced", data: { riotAccountId: account.id } }]
      : []),
    ...(forNewMatches
      ? [
          { name: "academy/check-assignments", data: { riotAccountId: account.id, userId: account.userId } },
          // Replaces both the per-match fan-out that used to sit in the ingest loop and the
          // fifteen-match backfill sweep that used to run here. The sweep only existed because
          // the fan-out kept losing its work.
          { name: "match/enrich-ranks", data: { riotAccountId: account.id, region: account.region } },
        ]
      : []),
  ];
  await dispatchOrReport(events, "sync");

  // The timeline capture is dispatched on its own because it is the one of these that can be
  // run here instead. It matters more than the others too: LA-66 found that on a machine
  // without Inngest it had never run once, which is why the feature it feeds could not be
  // verified at all. The Inngest worker and this call reach the same service.
  if (forNewMatches) {
    await dispatchOrRunInProcess(
      { name: "timeline/fetch-for-account", data: { riotAccountId: account.id } },
      () => runTimelineCaptureForAccount(account.id)
    );
  }

  if (forNewMatches) {
    // Six keys, one per position. deleteCached would do a Redis command and a Postgres statement
    // for each — twelve round trips to forget six things.
    const positions = ["all", "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];
    await deleteCachedMany(
      positions.map((pos) => buildCacheKey("matchup-matrix", { riotAccountId: account.id, position: pos }))
    ).catch((err) => logger.warn("[sync] Cache bust failed", err));
  }

  logger.info(`[sync] Done: +${newCount} new, ${skipped} skipped, ${errors.length} errors, ranked=${rankedSnapshotted}`);
  if (errors.length > 0) logger.warn(`[sync] First error sample: ${errors[0]}`);

  return { newMatches: newCount, skipped, rankedSnapshotted, errors };
}
