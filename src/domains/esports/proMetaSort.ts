import type { ProChampionStat } from "@/domains/esports/types";

export type ProMetaSort = "picks" | "winRate";

export const PRO_META_SORTS: { key: ProMetaSort; label: string }[] = [
  { key: "picks", label: "Most picked" },
  { key: "winRate", label: "Best win rate" },
];

/**
 * Below this many picks a champion is excluded from the win-rate ordering.
 *
 * A single game at 100% would otherwise top a table people read as "what is
 * strong in pro play", which is the one thing a picks-and-results table must
 * not be made to say.
 */
export const MIN_PICKS_FOR_WIN_RATE_SORT = 3;

export function parseProMetaSort(raw: string | undefined): ProMetaSort {
  return raw === "winRate" ? "winRate" : "picks";
}

/** The table's rows in display order. Pick order is what the aggregate already produced. */
export function sortChampions(champions: ProChampionStat[], sort: ProMetaSort): ProChampionStat[] {
  if (sort === "picks") return champions;

  return [...champions]
    .filter((champion) => champion.picks >= MIN_PICKS_FOR_WIN_RATE_SORT)
    .sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1) || b.picks - a.picks);
}
