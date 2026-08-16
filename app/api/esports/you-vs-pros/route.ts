import { NextRequest, NextResponse } from "next/server";
import { VALID_REGIONS } from "@/domains/riot";
import { getSession } from "@/lib/auth/session";
import { listAccounts } from "@/domains/riot";
import {
  championAveragesFromDb,
  championAveragesFromRiotId,
} from "@/domains/esports/services/playerChampionService";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { ApiError } from "@/lib/api/errors";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// The signed-out path reaches Riot for anyone's account, so it carries the same
// ceiling as the public preview it is built on.
const RATE_LIMIT = { limit: 60, windowMs: 10 * 60 * 1000 };

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rate = await checkRateLimit(`you-vs-pros:${getIp(req)}`, RATE_LIMIT);
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);

  const { searchParams } = new URL(req.url);
  const champion = searchParams.get("champion")?.trim();
  if (!champion) {
    return NextResponse.json({ error: "champion is required." }, { status: 400 });
  }

  const gameName = searchParams.get("gameName")?.trim();
  const tagLine = searchParams.get("tagLine")?.trim();
  const region = searchParams.get("region")?.trim().toLowerCase();

  try {
    // No Riot ID given means "use mine" — which only means anything for a
    // signed-in reader with an account connected.
    if (!gameName && !tagLine) {
      const session = await getSession();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Sign in or give a Riot ID." }, { status: 401 });
      }

      const accounts = await listAccounts(session.user.id);
      const account = accounts.find((entry) => entry.isPrimary) ?? accounts[0];
      if (!account) {
        return NextResponse.json({ averages: null, source: "connected" });
      }

      return NextResponse.json({
        averages: await championAveragesFromDb(account.id, champion),
        source: "connected",
        riotId: `${account.gameName}#${account.tagLine}`,
      });
    }

    if (!gameName || !tagLine || !region) {
      return NextResponse.json(
        { error: "gameName, tagLine and region are required." },
        { status: 400 }
      );
    }
    if (!VALID_REGIONS.includes(region)) {
      return NextResponse.json({ error: "Unknown region." }, { status: 400 });
    }

    return NextResponse.json({
      averages: await championAveragesFromRiotId(gameName, tagLine, region, champion),
      source: "riot-id",
      riotId: `${gameName}#${tagLine}`,
    });
  } catch (err) {
    const code = err instanceof ApiError ? err.code : null;

    if (code === "RIOT_RATE_LIMITED") {
      return NextResponse.json(
        { error: "Riot is rate limiting us. Try again shortly." },
        { status: 429 }
      );
    }
    // A missing or expired key is ours, not the reader's. Telling them their
    // Riot ID does not exist would send them off to re-check a name that is
    // perfectly fine.
    if (code === "RIOT_UNAUTHORIZED") {
      logger.error("[you-vs-pros] Riot API key rejected", err);
      return NextResponse.json(
        { error: "Player lookup is temporarily unavailable." },
        { status: 503 }
      );
    }

    logger.warn("[you-vs-pros] lookup failed", err);
    return NextResponse.json({ error: "That Riot ID could not be found." }, { status: 404 });
  }
}
