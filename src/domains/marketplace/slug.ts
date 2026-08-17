// Coach slugs — the `/coaches/[slug]` handle.
//
// Assigned at approval rather than at signup, so a rejected application never
// burns a name and nobody reserves an impersonating URL by filling in a form.

/**
 * Paths under `/coaches/` that are ours, not a coach's.
 *
 * Small on purpose: the coach's own side lives under `/coach`, so the only
 * collisions possible are with list-level routes we might add here later.
 */
const RESERVED = new Set([
  "apply",
  "new",
  "search",
  "all",
  "top",
  "featured",
  "admin",
  "api",
  "me",
  "settings",
]);

/** The longest a slug may get before the collision suffix is appended. */
const MAX_LENGTH = 48;

const FOLD: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  ä: "a",
  å: "a",
  æ: "ae",
  ø: "o",
  ß: "ss",
  ñ: "n",
  ł: "l",
};

/**
 * Turn a display name into a slug candidate.
 *
 * Folded to ASCII before stripping, not after: dropping non-ASCII outright
 * turns "Şükrü" into "kr", which is worse than a name nobody asked for. The
 * fold table covers the Latin scripts a Riot ID actually shows up in; anything
 * outside it (Hangul, Cyrillic, CJK) strips to nothing and falls back to the
 * caller's default, which is the honest outcome — a slug is a URL, not a name.
 */
export function slugify(input: string): string {
  const folded = input
    .toLowerCase()
    .normalize("NFD")
    // Combining marks left behind by NFD — "é" has already become "e" + U+0301.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[çğıöşüäåæøßñł]/g, (ch) => FOLD[ch] ?? ch);

  return folded
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, "");
}

/** Whether a slug is one we are keeping for ourselves. */
export function isReserved(slug: string): boolean {
  return RESERVED.has(slug);
}

/**
 * Pick a free slug from a display name, given what is already taken.
 *
 * `taken` is passed in rather than queried here so this stays pure and the
 * caller can do the lookup inside whatever transaction it is already holding.
 * Collisions get `-2`, `-3` and so on: a coach who shares a name with an
 * existing one should not have to invent a different name to be listed.
 */
export function pickSlug(
  displayName: string,
  taken: ReadonlySet<string>,
  fallback = "coach"
): string {
  const base = slugify(displayName) || fallback;

  if (!isReserved(base) && !taken.has(base)) return base;

  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}
