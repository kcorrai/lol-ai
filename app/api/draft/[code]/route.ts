import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { getSeriesForGame } from "@/domains/draft/server";
import { READ_LIMIT, serviceResponse } from "../_shared";

interface RouteParams {
  params: { code: string };
}

/**
 * The poll target (ADR-016). Returns the whole series plus the caller's resolved
 * role — never the tokens themselves, so a spectator who screenshots this
 * response cannot hand anyone a drafter seat.
 *
 * Reading may write: an expired turn is settled here, which is what lets a
 * lapsed turn resolve without either drafter being at their keyboard.
 */
export async function GET(req: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const rl = await checkRateLimit(`draft-read:${getIp(req)}`, READ_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const gameNumber = Number(req.nextUrl.searchParams.get("game") ?? "1");
  const token = req.nextUrl.searchParams.get("token");

  return serviceResponse(
    await getSeriesForGame(
      params.code,
      Number.isInteger(gameNumber) && gameNumber >= 1 ? gameNumber : 1,
      token
    )
  );
}
