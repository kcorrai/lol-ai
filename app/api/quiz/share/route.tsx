import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { z } from "zod";
import { buildShareCard, parseShareResults } from "@/domains/quiz";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { QuizShareCard } from "./quizShareTemplate";

export const runtime = "nodejs";

// The day's scorecard as a PNG. Public and anonymous: the card carries a puzzle
// number, a run of squares and a streak, and never a champion, so there is
// nothing here to authenticate or to spoil.

const querySchema = z.object({
  n: z.coerce.number().int().min(1).max(100_000),
  s: z.coerce.number().int().min(0).max(100_000).default(0),
  r: z.string().max(200).default(""),
});

export async function GET(request: NextRequest): Promise<Response> {
  const rate = await checkRateLimit(`quiz-share:${getIp(request)}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs, rate.limit);

  const { searchParams } = request.nextUrl;
  const parsed = querySchema.safeParse({
    n: searchParams.get("n") ?? "",
    s: searchParams.get("s") ?? 0,
    r: searchParams.get("r") ?? "",
  });
  if (!parsed.success) return new Response("Bad scorecard", { status: 400 });

  const model = buildShareCard({
    puzzleNumber: parsed.data.n,
    streak: parsed.data.s,
    results: parseShareResults(parsed.data.r),
  });

  const image = new ImageResponse(<QuizShareCard model={model} />, { width: 1000, height: 1000 });

  // The query string fully determines the picture, so a given card can be cached
  // as hard as the CDN will take it.
  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(image.body, { headers, status: image.status });
}
