import {
  esportsFixture,
  fixturesEnabled,
  livestatsFixture,
} from "@/domains/esports/services/esportsFixtures";

// The only module that knows the esports feeds exist. Everything else in the
// domain goes through esportsFetch/livestatsFetch, so the unofficial-endpoint
// handling (ADR-016) lives in exactly one place. How long an answer keeps is the
// other half of that, and lives in esportsCache.

export const ESPORTS_API_BASE = "https://esports-api.lolesports.com/persisted/gw";
export const LIVESTATS_BASE = "https://feed.lolesports.com/livestats/v1";
export const USER_AGENT = "laneiq (+https://lolaicoach.gg)";

// The key the lolesports.com web client ships inside its own JavaScript bundle.
// It is not a credential: it is public, tied to no account of ours, and grants
// nothing beyond the same public read access anyone gets by loading the site.
// It is read from the environment so it can be repointed without a deploy, and
// it must never be sent from a browser — every caller here is server-side.
const PUBLIC_WEB_KEY = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z";

function apiKey(): string {
  return process.env.LOLESPORTS_API_KEY || PUBLIC_WEB_KEY;
}

/**
 * The feed publishes some asset URLs over plain http. The CSP blocks mixed
 * content, so every image URL is upgraded on the way through the mapper.
 */
export function httpsAsset(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http://") ? `https://${url.slice("http://".length)}` : url;
}

interface FetchOptions {
  /** Extra query params. `hl` defaults to en-US and can be overridden. */
  params?: Record<string, string | undefined>;
  signal?: AbortSignal;
}

function buildUrl(base: string, path: string, params: Record<string, string | undefined>): string {
  const url = new URL(`${base}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** GET against the persisted-gw esports API. */
export function esportsFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const params = { hl: "en-US", ...options.params };
  if (fixturesEnabled()) return esportsFixture(path, params);

  const url = buildUrl(ESPORTS_API_BASE, path, params);
  return fetch(url, {
    headers: { "x-api-key": apiKey(), "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: options.signal,
    // esportsCache owns freshness for this domain. Letting the Next.js fetch
    // cache hold a second, differently-timed copy would mean two answers to
    // "how old is this", and the TTL table would stop being the truth.
    cache: "no-store",
  });
}

/** GET against the livestats game-state feed. It takes no API key. */
export function livestatsFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const params = { ...options.params };
  if (fixturesEnabled()) return livestatsFixture(path, params);

  const url = buildUrl(LIVESTATS_BASE, path, params);
  return fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: options.signal,
    cache: "no-store",
  });
}
