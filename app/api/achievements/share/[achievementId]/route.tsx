import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { ACHIEVEMENT_CATALOG } from "@/types/achievement";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { AchievementOgCard } from "./achievementOgTemplate";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { achievementId: string } }
): Promise<Response> {
  const rl = await checkRateLimit(`og-ach:${getIp(req)}`, { limit: 60, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const achievement = ACHIEVEMENT_CATALOG.find((a) => a.id === params.achievementId);
  if (!achievement) return new Response("Achievement not found", { status: 404 });

  const gameName = req.nextUrl.searchParams.get("gameName") ?? "Summoner";

  const image = new ImageResponse(
    <AchievementOgCard achievement={achievement} gameName={gameName} />,
    { width: 800, height: 420 }
  );

  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

  return new Response(image.body, { headers, status: image.status });
}
