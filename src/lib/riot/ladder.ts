/**
 * The ranked ladder collapsed onto one number, so two rank snapshots can be subtracted.
 *
 * Lives in `lib` because more than one domain needs it now (CLAUDE.md §4).
 * `src/domains/creator/lp.ts` holds the same arithmetic and predates this file; it is
 * left alone deliberately rather than refactored under an unrelated task, and its
 * comment explains why it did not reach across domains for it. This is the home the
 * rule points at, so that is the direction the consolidation should eventually go.
 */

import type { RankDivision, RankTier } from "@prisma/client";

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

/** Divisions run IV (bottom of a tier) up to I, which is the reverse of how they read. */
const DIVISION_ORDER: readonly RankDivision[] = ["IV", "III", "II", "I"];

const APEX: ReadonlySet<RankTier> = new Set<RankTier>(["MASTER", "GRANDMASTER", "CHALLENGER"]);
const APEX_TIER_INDEX = TIER_ORDER.indexOf("MASTER");

const LP_PER_DIVISION = 100;
const DIVISIONS_PER_TIER = DIVISION_ORDER.length;

export interface RankPoint {
  tier: RankTier;
  division: RankDivision;
  lp: number;
}

export function isApexTier(tier: RankTier): boolean {
  return APEX.has(tier);
}

/**
 * The rank as one LP figure measured from Iron IV 0 LP.
 *
 * Master, Grandmaster and Challenger share a single continuous LP pool — the upper two
 * are cutoffs applied to it rather than further tiers — so all three start where
 * Diamond I ends. Counting them as three more tiers would report a 400 LP gain to
 * anyone who crossed a cutoff without winning a game.
 */
export function absoluteLp(rank: RankPoint): number {
  const tierIndex = isApexTier(rank.tier) ? APEX_TIER_INDEX : TIER_ORDER.indexOf(rank.tier);
  const divisionIndex = isApexTier(rank.tier)
    ? 0
    : Math.max(0, DIVISION_ORDER.indexOf(rank.division));
  const base = (tierIndex * DIVISIONS_PER_TIER + divisionIndex) * LP_PER_DIVISION;
  return base + Math.max(0, rank.lp);
}

/** "Emerald II" — apex tiers carry no division, so they render as the tier alone. */
export function formatRank(tier: RankTier, division: RankDivision): string {
  const name = tier.charAt(0) + tier.slice(1).toLowerCase();
  return isApexTier(tier) ? name : `${name} ${division}`;
}

/**
 * Whether two snapshots sit in different *rank* slots rather than merely different LP.
 *
 * This is what separates a promotion worth a line on a timeline from the LP drift of an
 * ordinary evening. Apex tiers compare on the tier alone, since they have no divisions.
 */
export function isRankChange(from: RankPoint, to: RankPoint): boolean {
  if (from.tier !== to.tier) return true;
  if (isApexTier(from.tier) && isApexTier(to.tier)) return false;
  return from.division !== to.division;
}
