export interface ParsedRiotId {
  gameName: string;
  tagLine: string;
  /** "Name#TAG", normalised — what a URL and a cache key should use. */
  full: string;
}

/**
 * Riot's own limits: a game name is 3–16 characters, a tag 3–5 alphanumerics.
 *
 * The name class is deliberately wide — Riot IDs carry CJK, Cyrillic, accents and spaces — so it
 * is written against Unicode letter and number properties rather than an ASCII range. Getting this
 * wrong silently drops exactly the players a Turkish or Korean lobby is full of.
 *
 * The trailing lookahead is what stops "Someone#TOOLONGTAG" becoming "Someone#TOOLO": a tag that
 * runs on past five characters is not a Riot ID, and truncating it invents one we would then
 * spend a Riot call failing to find.
 */
const RIOT_ID =
  /([\p{L}\p{N}][\p{L}\p{N} _.]{1,14}[\p{L}\p{N}])\s*#\s*([\p{L}\p{N}]{2,5})(?![\p{L}\p{N}])/gu;

/** How many players one lobby can hold — and the cap on what a paste is allowed to cost us. */
export const MAX_LOBBY_SIZE = 10;

/**
 * Every Riot ID in a blob of pasted text, de-duplicated, in the order they appear.
 *
 * Built for the champion-select chat, which is the only way to scout a lobby before the game
 * starts: the Spectator API cannot see champion select at all, so a paste is the input. That chat
 * arrives in no reliable shape — comma-separated on one client, newline-separated on another,
 * wrapped in "X joined the lobby" on a third — so this reads IDs out of arbitrary text rather than
 * trying to parse a format.
 *
 * Tags are upper-cased and names keep their case: Riot treats both case-insensitively, but the
 * tag is displayed upper and the name is displayed as the player typed it.
 */
export function extractRiotIds(input: string, limit: number = MAX_LOBBY_SIZE): ParsedRiotId[] {
  const seen = new Set<string>();
  const found: ParsedRiotId[] = [];

  for (const match of input.matchAll(RIOT_ID)) {
    const gameName = match[1].trim();
    const tagLine = match[2].toUpperCase();
    // Case-insensitively unique: pasting a lobby twice must not scout everyone twice.
    const key = `${gameName.toLowerCase()}#${tagLine.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ gameName, tagLine, full: `${gameName}#${tagLine}` });
    if (found.length >= limit) break;
  }

  return found;
}

/**
 * The `ids` query parameter, which is what makes a scouted lobby a shareable link.
 *
 * Parsed with the same reader as the paste box so a URL can never accept an ID the textarea
 * would have rejected.
 */
export function parseIdsParam(
  raw: string | undefined,
  limit: number = MAX_LOBBY_SIZE
): ParsedRiotId[] {
  if (!raw) return [];
  return extractRiotIds(raw.split(",").join("\n"), limit);
}

/** The same list back as a query parameter. */
export function toIdsParam(ids: ParsedRiotId[]): string {
  return ids.map((id) => id.full).join(",");
}
