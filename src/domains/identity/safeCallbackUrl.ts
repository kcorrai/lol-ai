/**
 * The destination to send someone after they finish signing in.
 *
 * A `callbackUrl` reaches these forms through the query string, so it is attacker-supplied
 * by definition: a link to `/login?callbackUrl=https://evil.example` would otherwise turn
 * the site's own login flow into an open redirect, with the credibility of our domain in
 * front of it. Only a same-site path is followed — `//evil.example` is rejected as well,
 * because a protocol-relative URL starts with a slash and still leaves the site.
 *
 * Lives here rather than inside either form because both the password step and the
 * two-factor step read the same parameter, and a security check with two copies is a
 * security check that will eventually be fixed in one of them.
 */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
