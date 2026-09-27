import {
  buildPublicProfile,
  publicProfileCacheKey,
  type PublicProfileOptions,
} from "@/domains/riot/services/previewService";
import { deleteCached, getCached } from "@/lib/ai/aiCache";
import type { PublicProfileResponse } from "@/types/preview";

// The "Update" button on a public profile.
//
// A profile is served from cache — that is what lets a shared link be opened by thousands of people
// for the Riot cost of one. The price is that it can be up to a day old, so the visitor gets to ask
// for a fresh read, the way every stats site lets you. The cooldown is the profile's own age: a
// profile read from Riot two minutes ago is not read again, however many people press the button.

/** How recent a profile has to be before a refresh is refused. */
export const REFRESH_COOLDOWN_MS = 2 * 60_000;

/**
 * Profiles one visitor may pull fresh from Riot in ten minutes — by opening one nobody has cached,
 * or by pressing "Update". A fresh read costs about fifteen Riot calls, and on a personal key the
 * whole site gets ninety every two minutes, so without this one script empties the budget for
 * everyone. Cached profiles are never counted.
 */
export const FRESH_PROFILE_LOOKUPS = { limit: 10, windowMs: 10 * 60_000 };

export function freshLookupKey(ip: string): string {
  return `profile-lookup:${ip}`;
}

export type RefreshResult =
  | { refreshed: true; fetchedAt: string | null }
  | { refreshed: false; retryAfterMs: number };

export async function refreshPublicProfile(
  gameName: string,
  tagLine: string,
  region: string,
  options: PublicProfileOptions = {},
  now: number = Date.now()
): Promise<RefreshResult> {
  const cacheKey = publicProfileCacheKey(gameName, tagLine, region);
  const cached = await readQuietly(cacheKey);

  const fetchedAt = cached?.fetchedAt ? Date.parse(cached.fetchedAt) : NaN;
  const age = Number.isFinite(fetchedAt) ? now - fetchedAt : Infinity;
  if (age < REFRESH_COOLDOWN_MS) {
    return { refreshed: false, retryAfterMs: REFRESH_COOLDOWN_MS - age };
  }

  // The gate first: a refused visitor must not cost the profile its cached copy.
  await options.beforeRiot?.();
  await deleteCached(cacheKey).catch(() => undefined);
  const profile = await buildPublicProfile(gameName, tagLine, region);
  return { refreshed: true, fetchedAt: profile.fetchedAt ?? null };
}

async function readQuietly(key: string): Promise<PublicProfileResponse | null> {
  try {
    return ((await getCached(key)) as PublicProfileResponse | null) ?? null;
  } catch {
    return null;
  }
}
