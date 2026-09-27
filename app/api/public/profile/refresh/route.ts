import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  FRESH_PROFILE_LOOKUPS,
  freshLookupKey,
  refreshPublicProfile,
} from "@/domains/riot/services/preview/profileRefresh";
import { VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { ApiError } from "@/lib/api/errors";
import { checkRateLimit, getIp } from "@/lib/api/rateLimit";
import { logger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";

const Body = z.object({
  gameName: z.string().trim().min(1).max(64),
  tagLine: z.string().trim().min(1).max(16),
  region: z
    .string()
    .trim()
    .toLowerCase()
    .refine((r) => VALID_REGIONS.includes(r)),
});

class Throttled extends Error {
  constructor(readonly retryAfterMs: number) {
    super("throttled");
  }
}

const RIOT_ERRORS: Record<string, { message: string; status: number }> = {
  RIOT_NOT_FOUND: { message: "That Riot ID no longer exists.", status: 404 },
  RIOT_RATE_LIMITED: { message: "Riot is rate limiting us. Try again shortly.", status: 503 },
  RIOT_API_UNAVAILABLE: { message: "Riot API is temporarily unavailable.", status: 503 },
};

function error(code: string, message: string, status: number, retryAfterMs?: number) {
  const headers = retryAfterMs
    ? { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) }
    : undefined;
  return NextResponse.json({ error: { code, message } }, { status, headers });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return error("BAD_REQUEST", "gameName, tagLine and region are required.", 400);
  const { gameName, tagLine, region } = parsed.data;

  // Counted against the same allowance as opening an uncached profile: both cost a fresh read.
  const beforeRiot = async (): Promise<void> => {
    const rl = await checkRateLimit(freshLookupKey(getIp(req)), FRESH_PROFILE_LOOKUPS);
    if (!rl.allowed) throw new Throttled(rl.retryAfterMs);
  };

  try {
    return NextResponse.json({
      data: await refreshPublicProfile(gameName, tagLine, region, { beforeRiot }),
    });
  } catch (err) {
    if (err instanceof Throttled) {
      return error("RATE_LIMITED", "Too many lookups. Try again shortly.", 429, err.retryAfterMs);
    }
    const mapped = err instanceof ApiError ? RIOT_ERRORS[err.code] : undefined;
    if (mapped) return error((err as ApiError).code, mapped.message, mapped.status);
    logger.error("[public-profile-refresh] handler error", {
      gameName,
      tagLine,
      region,
      error: err instanceof Error ? err.message : String(err),
    });
    return error("SERVER_ERROR", "Server error occurred.", 500);
  }
}
