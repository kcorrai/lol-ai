import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { getReport } from "@/domains/coaching/services/reportService";
import { generateSpeech } from "@/lib/ai/tts";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";

// Every call is a paid speech synthesis of a whole report. `/api/coaching/voice/synthesize`
// has been capped since it was written; this route reaches the same provider and had no
// ceiling, so a loop over one finished report was an open tap on the AI budget.
const TTS_LIMIT = { limit: 20, windowMs: 3_600_000 };

export const GET = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`report-tts:${userId}`, TTS_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, rateCheck.limit);

  const segments = req.nextUrl.pathname.split("/");
  const reportId = segments.at(-2) ?? "";
  if (!reportId) throw Errors.validation("Missing reportId");

  const report = await getReport(reportId, userId);
  if (report.status !== "complete") throw Errors.validation("Report is not complete yet");
  if (!report.coachPersonaResponse) throw Errors.validation("No coach response available");

  const buffer = await generateSpeech(report.coachPersonaResponse);

  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new NextResponse(ab, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, max-age=3600",
    },
  });
});
