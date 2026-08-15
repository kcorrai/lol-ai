import { cache } from "react";
import { buildAccountPreview } from "@/domains/riot/services/previewService";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { ApiError } from "@/lib/api/errors";
import type { PreviewResponse } from "@/types/preview";

export type ProfileResult =
  | { ok: true; data: PreviewResponse }
  | { ok: false; reason: "not-found" | "rate-limited" };

/**
 * The public profile's data, loaded once per request.
 *
 * `cache()` matters here: Next calls `generateMetadata` and the page component separately, and
 * both need this payload. Without it every profile view cost two full Riot round trips — twelve
 * calls instead of six — for one page.
 *
 * `buildAccountPreview` rather than a second implementation of the same fetch: it already caches
 * the result for a day, which is what makes a shared profile link cheap to open.
 */
export const loadProfile = cache(
  async (gameName: string, tagLine: string, region: string): Promise<ProfileResult> => {
    if (!VALID_REGIONS.includes(region)) return { ok: false, reason: "not-found" };

    try {
      return { ok: true, data: await buildAccountPreview(gameName, tagLine, region) };
    } catch (err) {
      // Branch on the machine-readable code, never the message (TASK-285).
      const code = err instanceof ApiError ? err.code : null;
      return {
        ok: false,
        reason: code === "RIOT_RATE_LIMITED" ? "rate-limited" : "not-found",
      };
    }
  },
);
