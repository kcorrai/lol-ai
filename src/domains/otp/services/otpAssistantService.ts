import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { getAiClient } from "@/lib/ai/client";
import { buildOtpSystemPrompt, buildOtpUserPrompt } from "../prompts/otpPrompt";
import { otpAiOutputSchema, otpAnalysisSchema } from "../types/otp.types";
import type { OtpAnalysis } from "../types/otp.types";
import type { Position } from "@/types/common.types";

function extractJson(raw: string): string {
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (codeBlock) return codeBlock[1];
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

function otpCacheKey(champion: string, role: Position): string {
  return buildCacheKey("otp", { champion: champion.toLowerCase(), role });
}

/**
 * The stored analysis, or null — never a generation. Callers that need to reproduce something
 * built from an earlier analysis use this: regenerating would silently answer with a different
 * one, and anything derived from the first would no longer match.
 */
export async function getCachedOtpAnalysis(
  champion: string,
  role: Position
): Promise<OtpAnalysis | null> {
  const cached = await getCached(otpCacheKey(champion, role));
  if (cached === null) return null;
  const parsed = otpAnalysisSchema.safeParse(cached);
  return parsed.success ? parsed.data : null;
}

export async function getOtpAnalysis(champion: string, role: Position): Promise<OtpAnalysis> {
  const cacheKey = otpCacheKey(champion, role);

  const cached = await getCached(cacheKey);
  if (cached !== null) {
    const cacheResult = otpAnalysisSchema.safeParse(cached);
    if (cacheResult.success) return cacheResult.data;
  }

  const aiClient = getAiClient("otp-assistant");
  const response = await aiClient.complete(
    buildOtpSystemPrompt(champion),
    buildOtpUserPrompt(champion, role)
  );

  let rawParsed: unknown;
  try {
    rawParsed = JSON.parse(extractJson(response.content));
  } catch {
    throw new Error(
      `OTP AI response is not valid JSON. First 200 chars: ${response.content.slice(0, 200)}`
    );
  }

  const aiData = otpAiOutputSchema.parse(rawParsed);

  const result: OtpAnalysis = {
    champion,
    role,
    ...aiData,
    generatedAt: new Date().toISOString(),
  };

  await setCached(cacheKey, "otp", result, 14);
  return result;
}
