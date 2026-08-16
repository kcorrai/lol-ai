import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { syncRankedSnapshot } from "@/domains/riot/services/matchSyncRankedService";
import { assertRiotApiReachable } from "@/domains/riot/services/riotApiClient";

/**
 * Daily rank sampling for every connected account.
 *
 * `league-v4` only ever answers with a player's *current* standing — Riot exposes no endpoint for
 * "what was this account's LP on the 1st". A rank curve therefore cannot be reconstructed after the
 * fact; it only exists if someone sampled it at the time, and any day nobody sampled is lost for
 * good.
 *
 * Sampling used to happen exclusively inside a match sync, which runs when the player opens the
 * dashboard. That made the history a record of *visits* rather than of play: someone who queues
 * daily but drops in on Saturdays got one point a week, and the LP-change tiles on the recap and
 * the monthly milestone read zero. This sweep decouples the sampling from the visit.
 *
 * `syncRankedSnapshot` already skips a write when tier, division and LP are all unchanged, so a
 * daily pass over an idle account costs one Riot call and no row.
 */

/** Spacing between accounts. One account is one ranked lookup, so this caps the sweep at ~4 req/s. */
const ACCOUNT_DELAY_MS = 250;

/**
 * Ceiling on accounts per run, chosen against the route's 300s `maxDuration` with the delay above.
 * Reaching it is reported rather than swallowed — a silent truncation would look like a clean run.
 */
const MAX_ACCOUNTS_PER_RUN = 1000;

export interface RankSnapshotSweepResult {
  /** Accounts the sweep actually attempted. */
  attempted: number;
  /** Accounts whose ranked standing was read from Riot without error. */
  succeeded: number;
  /**
   * Accounts whose lookup failed — logged, never fatal to the sweep. Counts both a thrown error and
   * the failure `syncRankedSnapshot` reports in its return value, which is the common case: it
   * catches Riot errors internally and answers `rankedSnapshotted: false` rather than throwing.
   * Reading only the throw would let a sweep in which every account failed report a clean run.
   */
  failed: number;
  /** Accounts left untouched because `MAX_ACCOUNTS_PER_RUN` was hit. Zero on a complete sweep. */
  skippedOverCap: number;
  /** Set when the preflight failed and no account was sampled. Absent on a normal run. */
  abortedReason?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sweepRankSnapshots(): Promise<RankSnapshotSweepResult> {
  // Preflight before touching a single account. The ranked lookup answers `[]` for an expired key
  // exactly as it does for an unranked player, so without this a sweep run against a dead key walks
  // every account, writes nothing, and reports a flawless run — and the rank history quietly stops
  // while nobody is watching. This is the one failure this job exists to survive.
  try {
    await assertRiotApiReachable();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    logger.error(`[rank-sweep] aborting — Riot API unreachable: ${reason}`);
    return { attempted: 0, succeeded: 0, failed: 0, skippedOverCap: 0, abortedReason: reason };
  }

  const total = await prisma.riotAccount.count();

  // Oldest-updated first, so that if the cap ever bites, the accounts it drops are the ones most
  // recently sampled rather than an arbitrary slice.
  const accounts = await prisma.riotAccount.findMany({
    orderBy: { updatedAt: "asc" },
    take: MAX_ACCOUNTS_PER_RUN,
  });

  const skippedOverCap = Math.max(0, total - accounts.length);
  if (skippedOverCap > 0) {
    logger.warn(
      `[rank-sweep] ${total} accounts exceed the ${MAX_ACCOUNTS_PER_RUN} per-run cap — ${skippedOverCap} not sampled this run`
    );
  }

  let succeeded = 0;
  let failed = 0;

  for (const [index, account] of accounts.entries()) {
    try {
      const { rankedSnapshotted, errors } = await syncRankedSnapshot(account);
      if (rankedSnapshotted) {
        succeeded++;
      } else {
        failed++;
        logger.warn(
          `[rank-sweep] ${account.gameName}#${account.tagLine}: ${errors.join("; ") || "ranked lookup reported no snapshot"}`
        );
      }
    } catch (err) {
      // One unreachable account must not cost everyone else their sample for the day.
      failed++;
      logger.warn(
        `[rank-sweep] ${account.gameName}#${account.tagLine}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (index < accounts.length - 1) await sleep(ACCOUNT_DELAY_MS);
  }

  return { attempted: accounts.length, succeeded, failed, skippedOverCap };
}
