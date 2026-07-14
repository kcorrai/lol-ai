import { getMetaSnapshot } from "@/domains/meta/services/metaStatsService";
import type { CanonicalPosition } from "@/domains/meta/types";

export interface TierListEntry {
  championKey: string;
  name: string;
  tier: number; // 1 (best) .. 5
  rank: number; // ordinal within the lane
  winRate: number; // 0-100
  pickRate: number; // 0-100
  banRate: number; // 0-100
}

export interface RoleTierList {
  position: CanonicalPosition;
  patch: string;
  entries: TierListEntry[]; // sorted best-first
}

// op.gg tier (1-5) → conventional letter grade.
const TIER_LETTERS: Record<number, string> = { 1: "S", 2: "A", 3: "B", 4: "C", 5: "D" };
export function tierLetter(tier: number): string {
  return TIER_LETTERS[tier] ?? "?";
}

// Exclude near-zero pick rates so the list reflects the real meta, not off-meta noise.
const MIN_PICK_RATE = 0.3;

// Returns the champion tier list for one lane, ordered best-first, or null if the
// meta snapshot is unavailable.
export async function getTierList(position: CanonicalPosition): Promise<RoleTierList | null> {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return null;

  const entries: TierListEntry[] = [];
  for (const champion of snapshot.champions) {
    const stats = champion.positions.find((p) => p.position === position);
    if (!stats || stats.pickRate < MIN_PICK_RATE) continue;
    entries.push({
      championKey: champion.championKey,
      name: champion.name,
      tier: stats.tier,
      rank: stats.rank,
      winRate: stats.winRate,
      pickRate: stats.pickRate,
      banRate: stats.banRate,
    });
  }

  entries.sort((a, b) => {
    // Missing tier/rank (0) sinks to the bottom.
    const at = a.tier || 99;
    const bt = b.tier || 99;
    if (at !== bt) return at - bt;
    const ar = a.rank || 9999;
    const br = b.rank || 9999;
    if (ar !== br) return ar - br;
    return b.winRate - a.winRate;
  });

  return { position, patch: snapshot.patch, entries };
}
