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

function sourceUrl(mode: string, dateKey: string): string | null {
  if (mode === "ability") {
    const answer = answerFor("ability", dateKey);
    const ability = abilityFor(answer, dateKey);
    const folder = ability.slot === "P" ? "passive" : "spell";
    return `${DDRAGON}/cdn/${DATASET_VERSION}/img/${folder}/${ability.image}`;
  }
  if (mode === "splash") {
    const answer = answerFor("splash", dateKey);
    // Splash art is unversioned on Data Dragon, so this URL never goes stale.
    return `${DDRAGON}/cdn/img/champion/splash/${answer.id}_${skinNumFor(answer, dateKey)}.jpg`;
  }
  return null;
}

export async function GET(_request: NextRequest, { params }: { params: { mode: string } }) {
  const now = new Date();

  try {
    const upstream = sourceUrl(params.mode, utcDateKey(now));
    if (!upstream) return apiError("NOT_FOUND", "No asset for that mode", 404);

    const res = await fetch(upstream, { next: { revalidate: 86_400 } });
    if (!res.ok) {
      logger.warn(`[quiz/asset] Data Dragon returned ${res.status} for ${params.mode}`);
      return apiError("ASSET_UNAVAILABLE", "The artwork could not be loaded", 502);
    }

    return new NextResponse(res.body, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
        // Expires exactly when the puzzle does, so a shared cache can never hand
        // yesterday's picture to someone playing today.
        "Cache-Control": `public, max-age=0, s-maxage=${secondsUntilReset(now)}`,
      },
    });
  } catch (err) {
    logger.error("[quiz/asset] Unhandled error", err);
    return apiError("ASSET_UNAVAILABLE", "The artwork could not be loaded", 502);
  }
}
