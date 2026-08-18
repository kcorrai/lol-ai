import type { RankDivision, RankTier } from "@prisma/client";

// Absolute LP: the whole ranked ladder collapsed onto one number, so two rank
// snapshots can be subtracted.
//
// `src/domains/marketplace/rank.ts` already orders ranks, but `rankScore` there
// is a *sort key* — it spaces tiers 100,000 apart so comparisons never collide.
// Subtracting two of those gives a number that is not LP and cannot be shown to
// a viewer. A session counter needs true LP, which is a different calculation,
// so the tier order is repeated here rather than the function reused. Domains do
// not import each other's internals anyway (ADR-019).

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

/** Divisions run IV (bottom of a tier) to I (top), which is the reverse of how they read. */
const DIVISION_ORDER: readonly RankDivision[] = ["IV", "III", "II", "I"];

const APEX: ReadonlySet<RankTier> = new Set<RankTier>(["MASTER", "GRANDMASTER", "CHALLENGER"]);

/** Index of MASTER — where the divisioned part of the ladder ends. */
const APEX_TIER_INDEX = TIER_ORDER.indexOf("MASTER");

const LP_PER_DIVISION = 100;
const DIVISIONS_PER_TIER = DIVISION_ORDER.length;

export interface RankPoint {
  tier: RankTier;
  division: RankDivision;
  lp: number;
}

/** Whether this tier has meaningful divisions. */
export function isApex(tier: RankTier): boolean {
  return APEX.has(tier);
}

/**
 * The rank as a single LP figure measured from Iron IV 0 LP.
 *
 * Master, Grandmaster and Challenger share one continuous LP pool — the higher
 * two are cutoffs applied to it, not further tiers — so all three start where
 * Diamond I ends and are separated only by their LP. Treating them as three more
 * tiers would report a 400 LP gain to anyone who crossed a cutoff without
 * winning anything.
 */
export function absoluteLp(rank: RankPoint): number {
  const tierIndex = isApex(rank.tier) ? APEX_TIER_INDEX : TIER_ORDER.indexOf(rank.tier);
  const divisionIndex = isApex(rank.tier) ? 0 : Math.max(0, DIVISION_ORDER.indexOf(rank.division));
  const base = (tierIndex * DIVISIONS_PER_TIER + divisionIndex) * LP_PER_DIVISION;
  return base + Math.max(0, rank.lp);
}

/** LP gained (positive) or lost (negative) between two snapshots. */
export function lpDelta(from: RankPoint, to: RankPoint): number {
  return absoluteLp(to) - absoluteLp(from);
}

/** "+64" / "-21" / "0" — the form a viewer reads on an overlay. */
export function formatLpDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

/** "Emerald II" — apex tiers carry no division, so they render as just the tier. */
export function formatRank(tier: RankTier, division: RankDivision): string {
  const name = tier.charAt(0) + tier.slice(1).toLowerCase();
  return isApex(tier) ? name : `${name} ${division}`;
}

/**
 * How far along the climb from one rank to another, as 0..1.
 *
 * Clamped at both ends: a goal already passed reads as complete rather than
 * overflowing the progress bar, and a creator who set a goal below their current
 * rank sees a full bar instead of a negative one.
 */
export function progressToward(current: RankPoint, goal: RankPoint, from: RankPoint): number {
  const start = absoluteLp(from);
  const target = absoluteLp(goal);
  const now = absoluteLp(current);
  if (target <= start) return 1;
  return Math.min(1, Math.max(0, (now - start) / (target - start)));
}
