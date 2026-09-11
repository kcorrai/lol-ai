import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api/response";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
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
 * The one public route that spends somebody else's bandwidth.
 *
 * Every other asset here is answered from the edge, because the daily URL is the same URL for
 * everyone all day. A practice `seed` is not: each distinct value is a distinct URL, a cache
 * miss by construction, and an outbound request to Data Dragon that this server pays for and
 * Riot's CDN sees coming from our address. Without a ceiling, walking the seed space is a free
 * way to turn one visitor into unlimited origin traffic.
 *
 * Generous, because a real player loading a practice round pulls one image and the page may
 * legitimately retry: this stops a loop, not a person.
 */
const ASSET_RATE_LIMIT = { limit: 60, windowMs: 60_000 };

/**
 * The same bound `/api/quiz/today` and `/api/quiz/guess` already put on a practice seed. This
 * route read the raw parameter instead, so the one endpoint that does work per distinct seed
 * was the one that accepted a seed of any length.
 */
const seedSchema = z.string().min(1).max(64);

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
  const rl = await checkRateLimit(`quiz-asset:${getIp(request)}`, ASSET_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const now = new Date();
  const rawSeed = request.nextUrl.searchParams.get("seed");
  let seed: string | undefined;
  if (rawSeed !== null) {
    const parsed = seedSchema.safeParse(rawSeed);
    if (!parsed.success) return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, 422);
    seed = parsed.data;
  }

  try {
    const urls = candidates(params.mode, utcDateKey(now), seed);
    if (urls.length === 0) return apiError("NOT_FOUND", "No asset for that mode", 404);

    for (const url of urls) {
      // Not `next: { revalidate }`: a deferred refresh that rejects destroys the
      // response being piped, so an unreachable Data Dragon 500s this route instead of
      // moving to the next candidate (LA-13). The Cache-Control below is what actually
      // caches the image, at the edge.
      const res = await fetch(url, {
        // `no-cache` keeps this out of the framework cache exactly as `no-store` did,
        // without the prerender throw that made `no-store` a trap elsewhere (ADR-045).
        cache: "no-cache",
        signal: AbortSignal.timeout(8000),
      });
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
