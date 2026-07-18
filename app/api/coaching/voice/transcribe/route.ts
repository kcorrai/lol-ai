import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { checkRateLimit, rateLimitResponse } from "@/lib/api/rateLimit";
import { transcribeAudio } from "@/lib/ai/stt";

// 20 transcriptions per hour per user
const TRANSCRIBE_LIMIT = { limit: 20, windowMs: 3_600_000 };

export const POST = withAuth(async (req: NextRequest, { userId }) => {
  const rateCheck = await checkRateLimit(`voice-transcribe:${userId}`, TRANSCRIBE_LIMIT);
  if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs, TRANSCRIBE_LIMIT.limit);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    throw Errors.validation("Invalid form data");
  }

  const file = formData.get("audio");
  if (!(file instanceof Blob)) throw Errors.validation("Missing audio field");

  if (file.size > 25 * 1024 * 1024) throw Errors.validation("Audio file too large (max 25 MB)");

  const audioFile = new File([file], "voice.webm", { type: file.type || "audio/webm" });
  const text = await transcribeAudio(audioFile);

  return apiSuccess({ text });
});
