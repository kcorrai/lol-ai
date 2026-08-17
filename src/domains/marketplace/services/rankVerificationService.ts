import type { RankDivision, RankTier } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { higherRank } from "@/domains/marketplace/rank";
import type { Rank } from "@/domains/marketplace/rank";
import type { RankBadge } from "@/domains/marketplace/types";
import {
  BADGE_QUEUE,
  PROOF_SELECT,
  toBadge,
} from "@/domains/marketplace/services/rankBadgeService";

// The one thing no competitor offers.
//
// Metafy's help centre says it plainly: "no application, no waitlist, and no
// vetting" — a coach types a rank into their bio and that is the whole claim.
// We do not have to take anyone's word for it, because the account is already
// linked and the rank is already being read for the product's own sake.
//
// What this does *not* prove is who owns the account. Riot Sign-On is the only
// thing that would, it needs an invitation we do not have, and the old
// third-party-code mechanism was switched off in March 2022. So the proof is
// tiered and the badge is labelled honestly: `PLATFORM_CHECKED` means "we read
// this rank ourselves, on this date", not "Riot confirmed it is theirs". See
// ADR-023.

/** How long a checked rank stays current before the badge starts saying so. */
const FRESH_HOURS = 36;

export type CheckOutcome =
  | { ok: true; badge: RankBadge }
  | { ok: false; reason: "no-profile" | "not-owned" | "no-rank" };

/**
 * Read a linked account's rank and record it as this coach's proof.
 *
 * The rank comes from `ranked_history`, which is our own record of what Riot
 * returned — so this asserts nothing the product was not already reading, and
 * costs no extra Riot call. `staleAt` is stamped here rather than derived at
 * read time so a sweep can find a due badge with an indexed query.
 */
export async function checkRank(userId: string, riotAccountId: string): Promise<CheckOutcome> {
  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return { ok: false, reason: "no-profile" };

  // Ownership, not just existence: a coach must not be able to hang a badge on
  // somebody else's account by guessing an id.
  const account = await prisma.riotAccount.findFirst({
    where: { id: riotAccountId, userId },
    select: { id: true },
  });
  if (!account) return { ok: false, reason: "not-owned" };

  const current = await latestRank(riotAccountId);
  if (!current) return { ok: false, reason: "no-rank" };

  const peak = await peakRank(riotAccountId, current);
  const now = new Date();
  const staleAt = new Date(now.getTime() + FRESH_HOURS * 3_600_000);

  const proof = {
    riotAccountId,
    method: "PLATFORM_CHECKED" as const,
    tier: current.tier,
    division: current.division,
    leaguePoints: current.leaguePoints,
    peakTier: peak.tier,
    peakDivision: peak.division,
    checkedAt: now,
    staleAt,
  };

  const row = await prisma.coachRankProof.upsert({
    where: { coachProfileId_queueType: { coachProfileId: profile.id, queueType: BADGE_QUEUE } },
    create: { coachProfileId: profile.id, queueType: BADGE_QUEUE, ...proof },
    update: proof,
    select: PROOF_SELECT,
  });

  logger.info("[marketplace] rank checked", { coachProfileId: profile.id, tier: current.tier });
  return { ok: true, badge: toBadge(row, now) };
}

/**
 * Refresh every badge that has gone stale.
 *
 * Bounded per run: a sweep that tries to do everything on a bad day does none
 * of it, and the badges it skips are picked up by the next run — they are
 * already marked stale, which is what a reader sees either way.
 */
export async function refreshStaleBadges(
  limit = 200
): Promise<{ checked: number; failed: number }> {
  const due = await prisma.coachRankProof.findMany({
    where: {
      staleAt: { lte: new Date() },
      riotAccountId: { not: null },
      method: "PLATFORM_CHECKED",
    },
    orderBy: { staleAt: "asc" },
    take: limit,
    select: { riotAccountId: true, coachProfile: { select: { userId: true } } },
  });

  let checked = 0;
  let failed = 0;

  for (const row of due) {
    const result = await checkRank(row.coachProfile.userId, row.riotAccountId as string);
    if (result.ok) checked += 1;
    else failed += 1;
  }

  if (failed > 0) logger.warn("[marketplace] some badges did not refresh", { failed });
  return { checked, failed };
}

/** The most recent solo-queue snapshot we hold for an account. */
async function latestRank(riotAccountId: string) {
  const row = await prisma.rankedHistory.findFirst({
    where: { riotAccountId, queueType: BADGE_QUEUE },
    orderBy: { recordedAt: "desc" },
    select: { tier: true, division: true, lp: true },
  });
  return row ? { tier: row.tier, division: row.division, leaguePoints: row.lp } : null;
}

/**
 * The highest rank we have ever recorded for the account.
 *
 * Compared in code rather than ordered in SQL because the ladder is not
 * alphabetical and divisions run backwards — an `ORDER BY tier, division` would
 * cheerfully report Silver above Platinum. The row count per account is small.
 */
async function peakRank(
  riotAccountId: string,
  current: { tier: RankTier; division: RankDivision; leaguePoints: number }
): Promise<Rank> {
  const rows = await prisma.rankedHistory.findMany({
    where: { riotAccountId, queueType: BADGE_QUEUE },
    select: { tier: true, division: true, lp: true },
  });

  let best: Rank = { ...current };
  for (const row of rows) {
    best = higherRank(best, { tier: row.tier, division: row.division, leaguePoints: row.lp });
  }
  return best;
}
