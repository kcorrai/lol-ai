import type { TierListEntry } from "@/domains/meta";

export const SORT_COLUMNS = ["rank", "tier", "movement", "winRate", "pickRate", "banRate"] as const;
export type SortColumn = (typeof SORT_COLUMNS)[number];
export type SortDirection = "asc" | "desc";

/** The order the meta service already produced — best champion first. */
export const DEFAULT_SORT: { column: SortColumn; direction: SortDirection } = {
  column: "rank",
  direction: "asc",
};

/** How much a champion climbed since last patch. Lower rank number is better, so prev - now. */
function movement(entry: TierListEntry): number | null {
  // 0 means op.gg had no ranking for this champion last patch (usually a new or fringe pick).
  if (!entry.rank || !entry.prevPatchRank) return null;
  return entry.prevPatchRank - entry.rank;
}

/**
 * Sorts a tier list by one column.
 *
 * Rank and tier are "lower is better", so ascending on those means best-first — matching what the
 * page already shows. The rate columns and movement are "higher is better", so those default to
 * descending, and the caller flips direction on a repeat click.
 *
 * Champions with no previous-patch ranking sink to the bottom in *either* direction: they have no
 * movement to compare, and floating them to the top of an ascending sort would read as "these
 * fell hardest".
 */
export function sortEntries(
  entries: TierListEntry[],
  column: SortColumn,
  direction: SortDirection,
): TierListEntry[] {
  const factor = direction === "asc" ? 1 : -1;

  return [...entries].sort((a, b) => {
    if (column === "movement") {
      const ma = movement(a);
      const mb = movement(b);
      if (ma === null && mb === null) return a.rank - b.rank;
      if (ma === null) return 1;
      if (mb === null) return -1;
      return (ma - mb) * factor || a.rank - b.rank;
    }

    if (column === "tier") {
      // Equal tiers keep meta order rather than reshuffling arbitrarily.
      return (a.tier - b.tier) * factor || a.rank - b.rank;
    }

    if (column === "rank") return (a.rank - b.rank) * factor;

    return (a[column] - b[column]) * factor || a.rank - b.rank;
  });
}

/** Rate columns and movement read best-first when descending; rank and tier when ascending. */
export function defaultDirectionFor(column: SortColumn): SortDirection {
  return column === "rank" || column === "tier" ? "asc" : "desc";
}
