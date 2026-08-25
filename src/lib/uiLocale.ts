/**
 * The one language both products are written in, said to `Intl` as well as to the reader.
 *
 * `toLocaleString()` with no locale formats in whatever language the machine running it is
 * set to. That machine is a Turkish laptop for development and an American server in
 * production, so the same number rendered `11.177 games` in one place and `11,177 games` in
 * the other — inside an interface that is English either way, where the first reads as
 * eleven point one seven seven. Server-rendered pages then cached the wrong one.
 *
 * `app/layout.tsx` declares `lang="en"` and there is no i18n layer, so the interface has
 * exactly one language and this is where it says so. When there is a second language this
 * constant becomes an argument; until then it is a decision with one place to change it.
 *
 * `en-US` rather than `en-GB` because it is what `lang="en"` implies and what most of the
 * call sites that already name a locale use. For numbers the two are identical.
 */
export const UI_LOCALE = "en-US";

/**
 * A whole number with thousands separators — a game count, a match count, an XP total.
 *
 * Deliberately not a general number formatter. Every call site this replaces was counting
 * something, and a rate or a currency wants different rules and a different function.
 */
export function formatCount(value: number): string {
  return value.toLocaleString(UI_LOCALE);
}

/** A date, defaulting to what `toLocaleDateString` shows when asked for nothing in particular. */
export function formatDate(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  return toDate(value).toLocaleDateString(UI_LOCALE, options);
}

/** A date and a time together, for the places that were calling `toLocaleString` on a date. */
export function formatDateTime(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  return toDate(value).toLocaleString(UI_LOCALE, options);
}

/** A time alone, for a slot or an appointment whose day is already on screen. */
export function formatTime(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  return toDate(value).toLocaleTimeString(UI_LOCALE, options);
}

/**
 * Accepts what the call sites already hold.
 *
 * Most of them are ISO strings straight out of an API response and were writing
 * `new Date(iso)` at the call site; taking either saves the wrapper without hiding it.
 */
function toDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}
