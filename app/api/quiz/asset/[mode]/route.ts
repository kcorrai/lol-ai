import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api/response";
import {
  DATASET_VERSION,
  abilityFor,
  answerFor,
  secondsUntilReset,
  skinNumFor,
  utcDateKey,
} from "@/domains/quiz";
import { logger } from "@/lib/utils/logger";

// Serves the Ability icon and the Splash art without naming the champion.
//
// This route is the reason the visual modes are playable at all. Data Dragon
// puts the answer directly in the path — /img/spell/AatroxQ.png,
// /img/champion/splash/Aatrox_0.jpg — so linking those straight from the page
// means the network tab solves the puzzle. The bytes come through here instead,
// under a URL that says only which mode it is.

const DDRAGON = "https://ddragon.leagueoflegends.com";

/**
 * Candidates in preference order.
 *
 * Splash gets two: a champion's `skins[].num` list does not guarantee Data Dragon
 * actually serves art at that index — Ambessa lists skin 6 and
 * /splash/Ambessa_6.jpg is a 403 — so the chosen skin falls back to the base
 * splash, which always exists. Validating all 9,087 skins at build time would
 * mean hammering Data Dragon for a problem one extra request solves on the rare
 * day it happens.
 */
function candidates(mode: string, dateKey: string, seed?: string): string[] {
  if (mode === "ability") {
    const ability = abilityFor(answerFor("ability", dateKey, seed), dateKey, seed);
    const folder = ability.slot === "P" ? "passive" : "spell";
    return [`${DDRAGON}/cdn/${DATASET_VERSION}/img/${folder}/${ability.image}`];
  }
  if (mode === "splash") {
    const answer = answerFor("splash", dateKey, seed);
    // Splash art is unversioned on Data Dragon, so these URLs never go stale.
    const url = (num: number) => `${DDRAGON}/cdn/img/champion/splash/${answer.id}_${num}.jpg`;
    const chosen = skinNumFor(answer, dateKey, seed);
    return chosen === 0 ? [url(0)] : [url(chosen), url(0)];
  }
  return [];
}

export async function GET(request: NextRequest, { params }: { params: { mode: string } }) {
  const now = new Date();
  const seed = request.nextUrl.searchParams.get("seed") ?? undefined;

  try {
    const urls = candidates(params.mode, utcDateKey(now), seed);
    if (urls.length === 0) return apiError("NOT_FOUND", "No asset for that mode", 404);

    for (const url of urls) {
      const res = await fetch(url, { next: { revalidate: 86_400 } });
      if (!res.ok) {
        logger.warn(`[quiz/asset] Data Dragon returned ${res.status} for ${params.mode}`);
        continue;
      }
      return new NextResponse(res.body, {
        headers: {
          "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
          // The daily image expires exactly when the puzzle does, so a shared
          // cache can never hand yesterday's picture to someone playing today.
          // A practice image is keyed by its seed and never changes, so it can
          // be cached hard instead.
          "Cache-Control": seed
            ? "public, max-age=0, s-maxage=604800, immutable"
            : `public, max-age=0, s-maxage=${secondsUntilReset(now)}`,
        },
      });
    }

    return apiError("ASSET_UNAVAILABLE", "The artwork could not be loaded", 502);
  } catch (err) {
    logger.error("[quiz/asset] Unhandled error", err);
    return apiError("ASSET_UNAVAILABLE", "The artwork could not be loaded", 502);
  }
}
