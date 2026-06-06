import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { getReport } from "@/domains/coaching/services/reportService";
import { generateSpeech } from "@/lib/ai/tts";
import { Errors } from "@/lib/api/errors";

export const GET = withAuth(async (req: NextRequest, { userId }) => {
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
