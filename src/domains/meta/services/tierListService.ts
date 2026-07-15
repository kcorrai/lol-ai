import { getMetaSnapshot } from "@/domains/meta/services/metaStatsService";
import type { CanonicalPosition } from "@/domains/meta/types";
import type { SnapshotTier } from "@/domains/meta/services/opggShared";

export interface TierListEntry {
  championKey: string;
  name: string;
  tier: number; // 1 (best) .. 5
  rank: number; // ordinal within the lane
  prevPatchRank: number; // ordinal within the lane last patch (0 if unknown)
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
// meta snapshot is unavailable. An optional rank bracket (tier) narrows the data
// to that op.gg bracket (e.g. diamond_plus).
export async function getTierList(
  position: CanonicalPosition,
  tier?: SnapshotTier
): Promise<RoleTierList | null> {
  const snapshot = await getMetaSnapshot({ tier });
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
      prevPatchRank: stats.prevPatchRank,
      winRate: stats.winRate,
      pickRate: stats.pickRate,
      banRate: stats.banRate,
    });
  }

  sortTierEntries(entries);
  return { position, patch: snapshot.patch, entries };
}

// Shared best-first ordering: tier, then ordinal rank, then win rate. Missing
// tier/rank (0, e.g. brand-new champions) sinks to the bottom.
function sortTierEntries(entries: TierListEntry[]): void {
  entries.sort((a, b) => {
    const at = a.tier || 99;
    const bt = b.tier || 99;
    if (at !== bt) return at - bt;
    const ar = a.rank || 9999;
    const br = b.rank || 9999;
    if (ar !== br) return ar - br;
    return b.winRate - a.winRate;
  });
}

// The ARAM tier list from the aram snapshot (no lanes — one overall ranking).
// Ban rate is meaningless in ARAM, so it is reported as 0.
export async function getAramTierList(): Promise<RoleTierList | null> {
  const snapshot = await getMetaSnapshot({ mode: "aram" });
  if (!snapshot) return null;

  const entries: TierListEntry[] = snapshot.champions
    .filter((c) => c.overallPickRate >= MIN_PICK_RATE)
    .map((c) => ({
      championKey: c.championKey,
      name: c.name,
      tier: c.overallTier,
      rank: c.overallRank,
      prevPatchRank: c.prevPatchRank,
      winRate: c.overallWinRate,
      pickRate: c.overallPickRate,
      banRate: 0,
    }));

  sortTierEntries(entries);
  // "MIDDLE" is a filler — ARAM has no positions; consumers ignore it.
  return { position: "MIDDLE", patch: snapshot.patch, entries };
}
