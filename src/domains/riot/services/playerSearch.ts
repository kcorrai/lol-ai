import type { SearchQuery } from "@/lib/riot/riotId";

/** A row of the player index, as the search API hands it to the client. */
export interface IndexedPlayer {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId: number | null;
  summonerLevel: number | null;
  /** How many synced matches this player has appeared in. Drives the ordering. */
  seenCount: number;
  lastSeenAt: Date;
}

/** How many hits the dropdown shows. Past this the list stops being scannable. */
export const DEFAULT_SEARCH_LIMIT = 8;

/**
 * Prefix matching is done in SQL, but "which of these did they mean" is not something an
 * `ORDER BY` expresses well, so the database is asked for a wider slice than we show and the
 * ordering is decided here.
 */
export const SEARCH_OVERFETCH = 60;

/**
 * Scores a hit against what was typed. Higher wins.
 *
 * Someone typing `faker` most likely wants the account actually called "Faker", not the first
 * of four hundred "FakerFan" rows that happens to have been seen most often — so an exact name
 * outranks popularity, and an exact name *and* tag outranks everything.
 */
function score(row: IndexedPlayer, query: SearchQuery): number {
  const nameExact = row.gameName.toLowerCase() === query.name;
  const tagExact = query.tag !== null && row.tagLine.toLowerCase() === query.tag;

  if (nameExact && tagExact) return 3;
  if (nameExact) return 2;
  if (tagExact) return 1;
  return 0;
}

/**
 * Orders autocomplete hits and trims them to the visible count.
 *
 * @param rows  index rows already narrowed to the name prefix by the database
 * @param query what the player has typed, parsed
 */
export function rankSearchHits(
  rows: readonly IndexedPlayer[],
  query: SearchQuery,
  limit: number = DEFAULT_SEARCH_LIMIT
): IndexedPlayer[] {
  const scored = rows.map((row) => ({ row, score: score(row, query) }));

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.row.seenCount - a.row.seenCount ||
      b.row.lastSeenAt.getTime() - a.row.lastSeenAt.getTime() ||
      // Two players seen the same number of times on the same day would otherwise swap places
      // between requests, which reads as the list flickering.
      a.row.gameName.localeCompare(b.row.gameName)
  );

  return scored.slice(0, limit).map((s) => s.row);
}
