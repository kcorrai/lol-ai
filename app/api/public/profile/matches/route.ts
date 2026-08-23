import { NextRequest, NextResponse } from "next/server";
import { buildPublicMatchPage } from "@/domains/riot/services/preview/previewPage";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { ApiError } from "@/lib/api/errors";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

// Matches the per-IP allowance on the other public profile reads. Each page is cached for a day
// behind Riot, so a repeat costs nothing and the limit only has to stop someone walking the
// whole ladder through this endpoint.
const RATE_LIMIT = { limit: 60, windowMs: 60_000 };

/** Deep enough that a bot cannot make us page through an account's whole two-year history. */
const MAX_START = 200;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const rl = await checkRateLimit(`public-matches:${getIp(req)}`, RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const { searchParams } = new URL(req.url);
  const gameName = searchParams.get("gameName")?.trim();
  const tagLine = searchParams.get("tagLine")?.trim();
  const region = searchParams.get("region")?.trim().toLowerCase();
  const start = Number(searchParams.get("start") ?? 0);

  if (!gameName || !tagLine || !region) {
    return NextResponse.json(
      { error: { message: "gameName, tagLine and region are required.", code: "BAD_REQUEST" } },
      { status: 400 }
    );
  }
  if (!VALID_REGIONS.includes(region)) {
    return NextResponse.json(
      { error: { message: "Invalid region.", code: "BAD_REQUEST" } },
      { status: 400 }
    );
  }
  if (!Number.isFinite(start) || start < 0 || start > MAX_START) {
    return NextResponse.json(
      { error: { message: "start is out of range.", code: "BAD_REQUEST" } },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json({ data: await buildPublicMatchPage(gameName, tagLine, region, start) });
  } catch (err) {
    return riotErrorResponse(err, { gameName, tagLine, region });
  }
}

/**
 * Riot failures, mapped off the machine-readable code rather than the message.
 *
 * `normalizeRiotError` puts the code on `.code` and a human sentence on `.message`, so matching
 * substrings of the message silently never fires and every failure — a typo'd Riot ID included —
 * collapses into a 500 (TASK-285).
 */
function riotErrorResponse(err: unknown, ctx: Record<string, string>): NextResponse {
  const code = err instanceof ApiError ? err.code : null;
  logger.error("[public-matches] handler error", {
    ...ctx,
    code,
    error: err instanceof Error ? err.message : String(err),
  });

  const byCode: Record<string, { message: string; status: number }> = {
    RIOT_NOT_FOUND: { message: "That Riot ID has no match history here.", status: 404 },
    RIOT_RATE_LIMITED: { message: "Riot is rate limiting us. Try again shortly.", status: 503 },
    RIOT_API_UNAVAILABLE: { message: "Riot API is temporarily unavailable.", status: 503 },
  };
  const mapped = code ? byCode[code] : undefined;

  return NextResponse.json(
    { error: { message: mapped?.message ?? "Server error occurred.", code: code ?? "SERVER_ERROR" } },
    { status: mapped?.status ?? 500 }
  );
}
