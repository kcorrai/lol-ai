/**
 * How a rank is written and coloured.
 *
 * Crest colours are game data, not brand — they live on the `rank.*` scale in `tailwind.config.ts`
 * and stay off the accent ladder (ADR-015).
 */

const TIER_COLORS: Record<string, string> = {
  IRON: "text-rank-iron",
  BRONZE: "text-rank-bronze",
  SILVER: "text-rank-silver",
  GOLD: "text-rank-gold",
  PLATINUM: "text-rank-platinum",
  EMERALD: "text-rank-emerald",
  DIAMOND: "text-rank-diamond",
  MASTER: "text-rank-master",
  GRANDMASTER: "text-rank-grandmaster",
  CHALLENGER: "text-rank-challenger",
};

const TIER_LABELS: Record<string, string> = {
  IRON: "Iron",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  EMERALD: "Emerald",
  DIAMOND: "Diamond",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
  CHALLENGER: "Challenger",
};

export const POSITION_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support",
  FILL: "—",
};

export function tierColorClass(tier: string): string {
  return TIER_COLORS[tier] ?? "text-text-body";
}

export function tierLabel(tier: string): string {
  return TIER_LABELS[tier] ?? tier;
}

/** "Diamond II · 74 LP", or "Unranked" when there is no solo queue entry. */
export function rankLine(rank: { tier: string; division: string; lp: number } | null): string {
  return rank ? `${tierLabel(rank.tier)} ${rank.division} · ${rank.lp} LP` : "Unranked";
}
