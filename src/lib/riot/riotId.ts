/**
 * Riot ID parsing shared by account connection and player search.
 *
 * Both read the same thing off a keyboard — `GameName#TAG` — and both have to survive the same
 * junk browsers put in the box, so the sanitiser lives here rather than being copied twice.
 */

/**
 * Strip Unicode directional formatting characters that some browsers inject into form inputs
 * (e.g. U+2066 LTR Isolate, added by the Turkish locale in Opera/Chrome).
 */
export function sanitizeRiotIdPart(s: string): string {
  return s.replace(/[⁦-⁩‎‏‪-‮]/g, "").trim();
}

/** A partially-typed Riot ID. `tag` is null until the player types the `#`. */
export interface SearchQuery {
  /** Lowercased name prefix. Never empty. */
  name: string;
  /** Lowercased tag prefix, or null when no `#` has been typed yet. */
  tag: string | null;
}

/**
 * Below this the result set is the whole index and means nothing — a single letter matches
 * thousands of players and the dropdown would just be noise.
 */
export const MIN_QUERY_LENGTH = 2;

/**
 * Parses what the player has typed so far into a name/tag prefix pair.
 *
 * Returns null when there is not yet enough to search on, which is the caller's signal to show
 * nothing rather than to show everything.
 */
export function parseSearchQuery(raw: string): SearchQuery | null {
  const clean = sanitizeRiotIdPart(raw);
  if (!clean) return null;

  // Only the first `#` splits: tags cannot contain one, so a second is part of the typed name.
  const hashAt = clean.indexOf("#");
  const name = (hashAt === -1 ? clean : clean.slice(0, hashAt)).trim().toLowerCase();
  const rawTag = hashAt === -1 ? "" : clean.slice(hashAt + 1).trim().toLowerCase();

  if (name.length < MIN_QUERY_LENGTH) return null;

  return { name, tag: rawTag.length > 0 ? rawTag : null };
}
