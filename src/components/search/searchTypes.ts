import type { SavedPlayer } from "@/lib/stores/searchStore";

/** A player the search box can offer. `puuid` is absent on a direct Riot ID guess. */
export interface SearchHit extends SavedPlayer {
  puuid?: string;
  summonerLevel?: number | null;
}

/**
 * Which group a row belongs to.
 *
 * `direct` is the escape hatch: the index only knows players who have shared a match with one of
 * our users, so a complete `Name#TAG` that we have never seen still gets an offered row, which
 * the profile page then resolves against Riot itself.
 */
export type RowSection = "players" | "recent" | "favorites" | "direct";

/** One keyboard-navigable row. The flat list is what arrow keys walk. */
export interface SearchRow {
  section: RowSection;
  hit: SearchHit;
}

export const SECTION_LABELS: Record<RowSection, string> = {
  players: "// Players",
  recent: "// Recent",
  favorites: "// Favorites",
  direct: "// Search Riot directly",
};

/** The URL a hit resolves to. The public profile page needs no login. */
export function profileHref(hit: SearchHit): string {
  return `/s/${hit.region}/${encodeURIComponent(hit.gameName)}/${encodeURIComponent(hit.tagLine)}`;
}
