/**
 * The one place an address is folded before it touches the database.
 *
 * Registration stored whatever case the visitor typed while the brute-force
 * counter keyed on the lower-cased form, and login looked the address up
 * verbatim. That is three different notions of "the same account": someone who
 * registered as `Player@Example.com` could not log in as `player@example.com`,
 * and — because `User.email` is unique on the exact string — could register a
 * second, separate account under the same address.
 *
 * Only the case is folded. Anything more (stripping dots, cutting at a `+`) would
 * merge addresses that genuinely deliver to different mailboxes on some hosts.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
