import type { CoachingReportOutput } from "@/domains/coaching/types/coaching.types";

function extractJson(raw: string): string {
  // Try markdown code block first
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (codeBlock) return codeBlock[1];

  // Fall back to finding the outermost JSON object
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }

  return raw.trim();
}

function isValidCoachingOutput(value: unknown): value is CoachingReportOutput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.summary !== "string") return false;
  if (!Array.isArray(v.strengths)) return false;
  if (!Array.isArray(v.weaknesses)) return false;
  if (!Array.isArray(v.actionItems) || v.actionItems.length !== 3) return false;
  if (typeof v.coachPersonaResponse !== "string") return false;
  return true;
}

export function parseCoachingResponse(rawText: string): CoachingReportOutput {
  const extracted = extractJson(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(extracted);
  } catch {
    throw new Error(
      `AI response is not valid JSON. First 200 chars: ${extracted.slice(0, 200)}`
    );
  }

  if (!isValidCoachingOutput(parsed)) {
    throw new Error(
      "AI response does not match expected coaching schema (missing required fields or actionItems.length !== 3)"
    );
  }

  return parsed;
}
