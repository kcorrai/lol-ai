import type { QueueType, RankDivision, RankTier } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { RankBadge } from "@/domains/marketplace/types";

// Reading rank badges. The writing side — checking a rank against Riot's data
// and recording it — is `rankVerificationService`, which imports the shape
// definitions from here.

/** The queue a badge is about. Flex is not what anyone means by "what rank are you". */
export const BADGE_QUEUE: QueueType = "RANKED_SOLO_5x5";

export const PROOF_SELECT = {
  method: true,
  tier: true,
  division: true,
  leaguePoints: true,
  peakTier: true,
  peakDivision: true,
  checkedAt: true,
  staleAt: true,
} as const;

export interface ProofRow {
  method: RankBadge["method"];
  tier: RankTier;
  division: RankDivision;
  leaguePoints: number;
  peakTier: RankTier | null;
  peakDivision: RankDivision | null;
  checkedAt: Date;
  staleAt: Date;
}

/**
 * A stored proof as the UI reads it.
 *
 * `stale` is derived here rather than stored, because it is a fact about *now*
 * and a row that was fresh when it was written does not stop being a row.
 */
export function toBadge(row: ProofRow, now: Date): RankBadge {
  return {
    method: row.method,
    tier: row.tier,
    division: row.division,
    leaguePoints: row.leaguePoints,
    peakTier: row.peakTier,
    peakDivision: row.peakDivision,
    checkedAt: row.checkedAt.toISOString(),
    stale: row.staleAt.getTime() <= now.getTime(),
  };
}

/** The coach's badge, or null if we have never checked one. */
export async function getBadge(coachProfileId: string): Promise<RankBadge | null> {
  const row = await prisma.coachRankProof.findUnique({
    where: { coachProfileId_queueType: { coachProfileId, queueType: BADGE_QUEUE } },
    select: PROOF_SELECT,
  });
  return row ? toBadge(row, new Date()) : null;
}

/** Badges for many coaches at once, so a search page costs one query. */
export async function badgesFor(coachProfileIds: string[]): Promise<Map<string, RankBadge>> {
  if (coachProfileIds.length === 0) return new Map();

  const rows = await prisma.coachRankProof.findMany({
    where: { coachProfileId: { in: coachProfileIds }, queueType: BADGE_QUEUE },
    select: { ...PROOF_SELECT, coachProfileId: true },
  });

  const now = new Date();
  return new Map(rows.map((row) => [row.coachProfileId, toBadge(row, now)]));
}

/** An account a coach could hang their badge on. */
export interface CheckableAccount {
  id: string;
  gameName: string;
  tagLine: string;
  region: string;
  /** True when this is the account the current badge was read from. */
  isBadgeSource: boolean;
}

/**
 * What the coach's own rank panel needs: the badge and the accounts behind it.
 *
 * One call rather than two, because a picker with no current state beside it
 * cannot tell the coach whether pressing anything would change something.
 */
export async function coachBadgeAndAccounts(
  userId: string
): Promise<{ badge: RankBadge | null; accounts: CheckableAccount[] }> {
  const [profile, accounts] = await Promise.all([
    prisma.coachProfile.findUnique({ where: { userId }, select: { id: true } }),
    prisma.riotAccount.findMany({
      where: { userId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: { id: true, gameName: true, tagLine: true, region: true },
    }),
  ]);

  if (!profile) {
    return { badge: null, accounts: accounts.map((a) => ({ ...a, isBadgeSource: false })) };
  }

  const proof = await prisma.coachRankProof.findUnique({
    where: { coachProfileId_queueType: { coachProfileId: profile.id, queueType: BADGE_QUEUE } },
    select: { ...PROOF_SELECT, riotAccountId: true },
  });

  return {
    badge: proof ? toBadge(proof, new Date()) : null,
    accounts: accounts.map((a) => ({ ...a, isBadgeSource: proof?.riotAccountId === a.id })),
  };
}
