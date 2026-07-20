import { prisma } from "@/lib/db/prisma";
import { getAccountByPuuid } from "@/domains/riot/services/riotApiClient";
import { ApiError } from "@/lib/api/errors";
import { logger } from "@/lib/utils/logger";

// Riot renames a forgotten account's summoner to `rtbf<summonerID>` — "player with
// summonerID 12345 will now be listed as rtbf12345".
// https://www.riotgames.com/en/DevRel/gdpr-right-to-be-forgotten-compliance
const RTBF_NAME = /^rtbf\d*$/i;

/** How stale an account may get before the sweep re-confirms it against Riot. */
export const RTBF_REFRESH_DAYS = 30;

export type RtbfVerdict =
  | { forgotten: false }
  | { forgotten: true; reason: "renamed" | "gone" };

export function isRtbfName(name: string | null | undefined): boolean {
  return typeof name === "string" && RTBF_NAME.test(name.trim());
}

/**
 * Ask Riot whether the account behind a puuid has been forgotten.
 *
 * Only two signals count: the rtbf rename, and the account no longer existing.
 * Riot also drops forgotten accounts to level 1, but so is every genuinely new
 * player — treating that as a trigger would delete real users' data, so it is
 * never consulted here.
 *
 * Anything else (rate limits, 5xx, network) is reported as *not* forgotten. The
 * sweep runs daily; skipping an account until tomorrow is harmless, whereas
 * treating a transient Riot outage as "forgotten" would irreversibly delete data.
 */
export async function checkForgotten(puuid: string, region: string): Promise<RtbfVerdict> {
  try {
    const account = await getAccountByPuuid(puuid, region);
    return isRtbfName(account.gameName) ? { forgotten: true, reason: "renamed" } : { forgotten: false };
  } catch (err) {
    if (err instanceof ApiError && err.code === "RIOT_NOT_FOUND") {
      return { forgotten: true, reason: "gone" };
    }
    throw err;
  }
}

export interface PurgeResult {
  participantsScrubbed: number;
  accountsDeleted: number;
}

/**
 * Remove every association with a forgotten puuid.
 *
 * MatchParticipant rows are scrubbed rather than deleted: they exist for all ten
 * players in a match, so deleting them would leave matches with holes and skew
 * every aggregate built on them. Nulling the Riot ID leaves a pseudonymous
 * puuid-keyed row, which is what Riot asks for — the association with a named
 * person is what must go.
 *
 * Scrub before delete. Dropping the RiotAccount first would null out
 * `riotAccountId` (the relation is optional with no cascade, schema.prisma:376)
 * and strand those rows with their names intact.
 */
export async function purgeForgotten(puuid: string): Promise<PurgeResult> {
  return prisma.$transaction(async (tx) => {
    const scrubbed = await tx.matchParticipant.updateMany({
      where: { puuid },
      data: { gameName: null, tagLine: null },
    });
    const deleted = await tx.riotAccount.deleteMany({ where: { puuid } });

    return { participantsScrubbed: scrubbed.count, accountsDeleted: deleted.count };
  });
}

export interface SweepResult {
  checked: number;
  forgotten: number;
  failed: number;
  remaining: number;
}

/**
 * Re-confirm the accounts we have not heard from in RTBF_REFRESH_DAYS.
 *
 * `lastSyncedAt` already means "when Riot last confirmed this account", so it is
 * the staleness clock — no extra column, and accounts kept fresh by the normal
 * sync path are skipped for free.
 *
 * `remaining` is returned and logged so a capped run is never mistaken for full
 * coverage: a backlog larger than `batchSize` drains over subsequent days.
 */
export async function sweepForgottenAccounts(batchSize = 50): Promise<SweepResult> {
  const cutoff = new Date(Date.now() - RTBF_REFRESH_DAYS * 24 * 60 * 60 * 1000);
  const where = { OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: cutoff } }] };

  const [stale, total] = await Promise.all([
    prisma.riotAccount.findMany({
      where,
      select: { puuid: true, region: true },
      orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } },
      take: batchSize,
    }),
    prisma.riotAccount.count({ where }),
  ]);

  let forgotten = 0;
  let failed = 0;

  for (const account of stale) {
    try {
      const verdict = await checkForgotten(account.puuid, account.region);
      if (!verdict.forgotten) continue;

      const result = await purgeForgotten(account.puuid);
      forgotten++;
      logger.info("[rtbf] Purged forgotten account", {
        puuid: account.puuid.slice(0, 8),
        reason: verdict.reason,
        ...result,
      });
    } catch (err) {
      // One unreachable account must not abandon the rest of the batch.
      failed++;
      logger.warn(
        `[rtbf] Check failed for ${account.puuid.slice(0, 8)}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { checked: stale.length, forgotten, failed, remaining: Math.max(0, total - stale.length) };
}
