import { parseSearchQuery, sanitizeRiotIdPart } from "@/lib/riot/riotId";
import { playerKey, type SavedPlayer } from "@/lib/stores/searchStore";
import type { SearchHit, SearchRow } from "@/components/search/searchTypes";

interface Input {
  /** Raw contents of the box. */
  query: string;
  /** The region chip, used for a direct Riot ID guess. */
  region: string;
  hits: readonly SearchHit[];
  recent: readonly SavedPlayer[];
  favorites: readonly SavedPlayer[];
}

/**
 * Decides what the dropdown shows, as one flat list in the order arrow keys walk it.
 *
 * With nothing typed the box is a shortcut list — favourites first, then recently viewed. Once a
 * query is in, it is index hits, plus one "search Riot directly" row when a complete `Name#TAG`
 * has been typed that the index does not know. That last row is what keeps an incomplete index
 * from being a dead end: the profile page resolves the Riot ID itself.
 */
export function buildSearchRows({ query, region, hits, recent, favorites }: Input): SearchRow[] {
  const parsed = parseSearchQuery(query);

  if (!parsed) {
    const favoriteKeys = new Set(favorites.map(playerKey));
    return [
      ...favorites.map((hit) => ({ section: "favorites" as const, hit })),
      // A favourite is already on screen; repeating it under Recent wastes a row.
      ...recent
        .filter((r) => !favoriteKeys.has(playerKey(r)))
        .map((hit) => ({ section: "recent" as const, hit })),
    ];
  }

  const rows: SearchRow[] = hits.map((hit) => ({ section: "players" as const, hit }));

  if (parsed.tag === null) return rows;

  const alreadyListed = hits.some(
    (h) => h.gameName.toLowerCase() === parsed.name && h.tagLine.toLowerCase() === parsed.tag
  );
  if (alreadyListed) return rows;

  // Preserve what was typed rather than the lowercased parse: Riot IDs are displayed with their
  // original casing, and this row is a guess the player should recognise.
  const typed = sanitizeRiotIdPart(query);
  const hashAt = typed.indexOf("#");

  rows.push({
    section: "direct",
    hit: {
      gameName: typed.slice(0, hashAt).trim(),
      tagLine: typed.slice(hashAt + 1).trim(),
      region,
    },
  });

  return rows;
}
