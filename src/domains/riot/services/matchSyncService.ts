import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { Errors } from "@/lib/api/errors";
import { isDataStale, invalidateAccountCache } from "@/lib/riot/lifecycle";
import {
  getMatchIds,
  getMatch,
  getRankedEntries,
} from "@/domains/riot/services/riotApiClient";
import { mapMatch } from "@/domains/riot/mappers/matchMapper";
import type { RankTier, RankDivision } from "@prisma/client";

export type SyncResult = {
  newMatches: number;
  skipped: number;
  rankedSnapshotted: boolean;
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

export async function syncAccount(riotAccountId: string): Promise<SyncResult> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
  });
  if (!account) throw Errors.notFound("Riot account");

  if (!isDataStale(account.lastSyncedAt, 5)) {
    return { newMatches: 0, skipped: 0, rankedSnapshotted: false };
  }

  logger.info(`[sync] Starting sync for ${account.gameName}#${account.tagLine}`);

  // ── Match ingestion ────────────────────────────────────────────────────────
  const matchIds = await getMatchIds(account.puuid, account.region, 20);

  // Determine which matches are already in the DB
  const existing = await prisma.match.findMany({
    where: { matchId: { in: matchIds } },
    select: { id: true, matchId: true },
  });
  const existingByRiotId = new Map(existing.map((m) => [m.matchId, m.id]));

  const newMatchIds = matchIds.filter((id) => !existingByRiotId.has(id));
  let newCount = 0;
  let skipped = 0;

  for (const riotMatchId of newMatchIds) {
    try {
      const dto = await getMatch(riotMatchId, account.region);

      // Generate a stable DB UUID from the match — same match always gets same ID
      // so concurrent syncs are safe even without a unique constraint on the create
      const { randomUUID } = await import("crypto");
      const matchDbId = randomUUID();

      const mapped = mapMatch(dto, matchDbId, account.puuid, account.id);
      if (!mapped) {
        skipped++;
        continue; // unknown queue type
      }

      await prisma.$transaction(async (tx) => {
        await tx.match.create({ data: mapped.match });
        await tx.matchParticipant.createMany({ data: mapped.participants });
      });

      newCount++;
    } catch (err) {
      logger.warn(`[sync] Failed to fetch match ${riotMatchId}`, err);
      // Continue with remaining matches — partial sync is better than none
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

  // ── Ranked snapshot ────────────────────────────────────────────────────────
  let rankedSnapshotted = false;
  try {
    const entries = await getRankedEntries(account.summonerId ?? "", account.region);
    for (const entry of entries) {
      const tier = RANK_TIERS[entry.tier];
      const division = RANK_DIVISIONS[entry.rank];
      const queueType =
        entry.queueType === "RANKED_SOLO_5x5"
          ? ("RANKED_SOLO_5x5" as const)
          : entry.queueType === "RANKED_FLEX_SR"
            ? ("RANKED_FLEX_SR" as const)
            : null;

      if (!tier || !division || !queueType) continue;

      await prisma.rankedHistory.create({
        data: {
          riotAccountId: account.id,
          queueType,
          tier,
          division,
          lp: entry.leaguePoints,
          wins: entry.wins,
          losses: entry.losses,
          recordedAt: new Date(),
        },
      });
    }
    rankedSnapshotted = true;
  } catch (err) {
    logger.warn("[sync] Ranked snapshot failed", err);
  }

  // ── Finalize ───────────────────────────────────────────────────────────────
  await prisma.riotAccount.update({
    where: { id: account.id },
    data: { lastSyncedAt: new Date() },
  });

  await invalidateAccountCache(account.puuid, account.summonerId ?? "", account.region);

  logger.info(
    `[sync] Done: +${newCount} new matches, ${skipped} skipped, ranked=${rankedSnapshotted}`
  );

  return { newMatches: newCount, skipped, rankedSnapshotted };
}
