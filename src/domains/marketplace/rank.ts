import type { RankDivision, RankTier } from "@prisma/client";

// Pure rank arithmetic. No database, no Riot — just the ordering that lets us
// say which of two ranks is higher, which is the only thing peak tracking and
// a "Diamond and above" filter actually need.

/** Tiers from lowest to highest. Index is the comparison key. */
const TIER_ORDER: readonly RankTier[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];

/** Divisions run IV (lowest) to I (highest), which is the opposite of how they read. */
const DIVISION_ORDER: readonly RankDivision[] = ["IV", "III", "II", "I"];

/**
 * Tiers with no divisions.
 *
 * Riot still returns `I` for these, and comparing on it would be meaningless —
 * a Challenger is not "one division above" another Challenger. LP is the only
 * separator up here, which is why it is the tiebreak below.
 */
const APEX: ReadonlySet<RankTier> = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

export interface Rank {
  tier: RankTier;
  division: RankDivision;
  leaguePoints?: number;
}

/** Whether this tier has meaningful divisions. */
export function isApex(tier: RankTier): boolean {
  return APEX.has(tier);
}

/**
 * A single sortable number for a rank.
 *
 * Tier dominates, then division, then LP — so this can be compared directly and
 * used as a search sort key. Apex tiers ignore division for the reason above.
 */
export function rankScore(rank: Rank): number {
  const tier = TIER_ORDER.indexOf(rank.tier);
  const division = isApex(rank.tier)
    ? DIVISION_ORDER.length - 1
    : DIVISION_ORDER.indexOf(rank.division);
  const lp = Math.max(0, Math.min(rank.leaguePoints ?? 0, 5000));
  return tier * 100_000 + division * 10_000 + lp;
}

/** Negative if `a` is lower, positive if higher, zero if the same. */
export function compareRanks(a: Rank, b: Rank): number {
  return rankScore(a) - rankScore(b);
}

/** The higher of two ranks. Returns `b` only when it is strictly higher. */
export function higherRank(a: Rank, b: Rank): Rank {
  return compareRanks(b, a) > 0 ? b : a;
}

/** Every tier at or above the given one, for a "Diamond and above" filter. */
export function tiersAtOrAbove(tier: RankTier): RankTier[] {
  return TIER_ORDER.slice(TIER_ORDER.indexOf(tier));
}

/**
 * How a rank is written on a badge.
 *
 * Apex tiers get their LP instead of a division, which is how the game itself
 * writes them and what players actually compare on up there.
 */
export function formatRank(rank: Rank): string {
  if (isApex(rank.tier)) {
    const lp = rank.leaguePoints ?? 0;
    return `${titleCase(rank.tier)} ${lp} LP`;
  }
  return `${titleCase(rank.tier)} ${rank.division}`;
}

function titleCase(tier: RankTier): string {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}
