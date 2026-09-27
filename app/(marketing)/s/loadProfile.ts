import { cache } from "react";
import { headers } from "next/headers";
import { buildPublicProfile } from "@/domains/riot/services/previewService";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { ApiError } from "@/lib/api/errors";
import { checkRateLimit, ipFromHeaders } from "@/lib/api/rateLimit";
import type { PublicProfileResponse } from "@/types/preview";

export type ProfileResult =
  | { ok: true; data: PublicProfileResponse }
  | { ok: false; reason: "not-found" | "rate-limited" | "throttled" };

/**
 * Profiles one visitor may pull fresh from Riot in ten minutes.
 *
 * Only fresh ones count — a cached profile costs nothing and is never limited. A fresh one costs
 * about fifteen Riot calls, and on a personal key the whole site gets ninety every two minutes, so
 * without this one script guessing names empties the budget for everyone.
 */
const FRESH_LOOKUPS = { limit: 10, windowMs: 10 * 60_000 };

class LookupThrottled extends Error {}

async function limitFreshLookups(): Promise<void> {
  const limit = await checkRateLimit(`profile-lookup:${ipFromHeaders(headers())}`, FRESH_LOOKUPS);
  if (!limit.allowed) throw new LookupThrottled();
}

/**
 * The public profile's data, loaded once per request.
 *
 * `cache()` matters here: Next calls `generateMetadata` and the page component separately, and
 * both need this payload. Without it every profile view cost two full Riot round trips — twelve
 * calls instead of six — for one page.
 *
 * `buildPublicProfile` rather than a second implementation of the same fetch: it already caches
 * the result for a day, which is what makes a shared profile link cheap to open. It is the
 * preview's superset — same rows, plus each match's ten-player scoreboard and the account's
 * mastery — and the extras are why this page and not the landing teaser calls it (LA-69).
 */
export const loadProfile = cache(
  async (gameName: string, tagLine: string, region: string): Promise<ProfileResult> => {
    if (!VALID_REGIONS.includes(region)) return { ok: false, reason: "not-found" };

    try {
      const data = await buildPublicProfile(gameName, tagLine, region, {
        beforeRiot: limitFreshLookups,
      });
      return { ok: true, data };
    } catch (err) {
      if (err instanceof LookupThrottled) return { ok: false, reason: "throttled" };
      // Branch on the machine-readable code, never the message (TASK-285).
      const code = err instanceof ApiError ? err.code : null;
      return {
        ok: false,
        reason: code === "RIOT_RATE_LIMITED" ? "rate-limited" : "not-found",
      };
    }
  }
);
