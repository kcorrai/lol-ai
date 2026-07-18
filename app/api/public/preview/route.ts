import { NextRequest, NextResponse } from "next/server";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { buildAccountPreview } from "@/domains/riot/services/previewService";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

const PREVIEW_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 }; // 10/hour

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rl = await checkRateLimit(`preview:${getIp(req)}`, PREVIEW_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const { searchParams } = new URL(req.url);
  const gameName = searchParams.get("gameName")?.trim();
  const tagLine = searchParams.get("tagLine")?.trim();
  const region = searchParams.get("region")?.trim().toLowerCase();

  if (!gameName || !tagLine || !region) {
    return NextResponse.json(
      { error: "gameName, tagLine and region are required." },
      { status: 400 }
    );
  }
  if (!VALID_REGIONS.includes(region)) {
    return NextResponse.json({ error: "Invalid region." }, { status: 400 });
  }

  try {
    const data = await buildAccountPreview(gameName, tagLine, region);
    return NextResponse.json({ data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[preview] handler error", { gameName, tagLine, region, error: msg });

    if (msg.includes("404") || msg.includes("Not Found") || msg.includes("RIOT_NOT_FOUND")) {
      return NextResponse.json(
        { error: `${gameName}#${tagLine} not found. Check your Riot ID and region.` },
        { status: 404 }
      );
    }
    if (msg.includes("429") || msg.includes("RIOT_RATE_LIMITED")) {
      return NextResponse.json(
        { error: "Riot API rate limit exceeded. Try again in a few seconds." },
        { status: 503 }
      );
    }
    if (msg.includes("401") || msg.includes("403") || msg.includes("RIOT_UNAUTHORIZED") || msg.includes("RIOT_FORBIDDEN")) {
      return NextResponse.json(
        { error: "Riot API configuration error. Please try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Server error occurred." }, { status: 500 });
  }
}
