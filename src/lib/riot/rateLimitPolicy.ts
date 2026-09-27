// What Riot allows one API key, expressed the way Riot itself states it.
//
// Riot reports an application's limits on every response as `X-App-Rate-Limit: 20:1,100:120` —
// comma-separated `count:seconds` pairs, all of which apply at once. Reading the same format from
// config means the value can be pasted straight from a response, and switching from a personal key
// to a production key is a config change rather than a code change.

export interface RateWindow {
  limit: number;
  windowMs: number;
}

/** A personal key: 20 requests every second and 100 every two minutes, per region. */
export const PERSONAL_KEY_LIMITS = "20:1,100:120";

/**
 * The share of each window we allow ourselves.
 *
 * Riot starts its windows at the first request it sees, we start ours at the first request we
 * send, and the network sits between the two — so a window that is exactly full on our side can
 * already be over on Riot's. A repeated 429 escalates to a temporary and then longer blacklist of
 * the key, which takes every Riot-backed page down with it; giving up a tenth of the budget is the
 * cheaper side of that trade.
 */
const HEADROOM = 0.9;

export function parseRateLimitHeader(header: string | null | undefined): RateWindow[] {
  if (!header) return [];

  const windows: RateWindow[] = [];
  for (const part of header.split(",")) {
    const [count, seconds] = part.trim().split(":").map(Number);
    if (!Number.isFinite(count) || !Number.isFinite(seconds) || count <= 0 || seconds <= 0) {
      return [];
    }
    windows.push({ limit: Math.max(1, Math.floor(count * HEADROOM)), windowMs: seconds * 1000 });
  }

  // Shortest first. A refusal from the short window then costs nothing from the long one, which
  // matters for the stores that consume window by window (see rateLimitStores).
  return windows.sort((a, b) => a.windowMs - b.windowMs);
}

export function configuredWindows(
  value: string | undefined = process.env.RIOT_APP_RATE_LIMIT
): RateWindow[] {
  const parsed = parseRateLimitHeader(value);
  return parsed.length > 0 ? parsed : parseRateLimitHeader(PERSONAL_KEY_LIMITS);
}

/**
 * The scope Riot counts an application limit in.
 *
 * Limits are per routing value — `euw1`, `europe`, `americas` — and each routing value is its own
 * host, so the host is the scope. Two hosts never share a budget; one host always does.
 */
export function rateLimitScope(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
}
