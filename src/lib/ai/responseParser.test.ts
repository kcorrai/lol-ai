import { describe, it, expect } from "vitest";
import { parseCoachingResponse } from "./responseParser";

const validOutput = {
  summary: "Player shows solid mechanics but struggles with CS consistency.",
  strengths: [{ area: "Fighting", description: "High KDA.", evidence: "KDA: 4.2" }],
  weaknesses: [
    {
      area: "CS",
      description: "Below rank average.",
      priority: "high",
      evidence: "CS/min: 5.1 vs Gold avg 6.5",
    },
  ],
  actionItems: [
    {
      priority: 1,
      action: "Last-hit under tower",
      howTo: "Practice tool.",
      expectedImpact: "+1 CS/min",
      timeframe: "2 weeks",
    },
    {
      priority: 2,
      action: "Ward river",
      howTo: "Buy pink.",
      expectedImpact: "Vision improvement",
      timeframe: "Immediate",
    },
    {
      priority: 3,
      action: "Recall timing",
      howTo: "Recall with full gold.",
      expectedImpact: "Better item timings",
      timeframe: "1 week",
    },
  ],
  coachPersonaResponse: "You have the mechanics, but fundamentals need work.",
};

describe("parseCoachingResponse", () => {
  it("parses a clean JSON string", () => {
    const result = parseCoachingResponse(JSON.stringify(validOutput));
    expect(result.summary).toBe(validOutput.summary);
    expect(result.actionItems).toHaveLength(3);
  });

  it("extracts JSON from a markdown code block", () => {
    const wrapped = `\`\`\`json\n${JSON.stringify(validOutput)}\n\`\`\``;
    const result = parseCoachingResponse(wrapped);
    expect(result.summary).toBe(validOutput.summary);
  });

  it("extracts JSON when prefixed with extra text", () => {
    const withPrefix = `Here is your coaching report:\n${JSON.stringify(validOutput)}`;
    const result = parseCoachingResponse(withPrefix);
    expect(result.summary).toBe(validOutput.summary);
  });

  it("throws when the response is not JSON", () => {
    expect(() => parseCoachingResponse("This is not JSON at all.")).toThrow(/not valid JSON/);
  });

  it("throws when summary field is missing", () => {
    // JSON.stringify omits undefined values — effectively removes the field
    const withoutSummary = { ...validOutput, summary: undefined };
    expect(() => parseCoachingResponse(JSON.stringify(withoutSummary))).toThrow(/schema/);
  });

  it("throws when actionItems has fewer than 3 items", () => {
    const twoItems = { ...validOutput, actionItems: validOutput.actionItems.slice(0, 2) };
    expect(() => parseCoachingResponse(JSON.stringify(twoItems))).toThrow(/schema/);
  });

  it("throws when actionItems has more than 3 items", () => {
    const fourItems = {
      ...validOutput,
      actionItems: [...validOutput.actionItems, validOutput.actionItems[0]],
    };
    expect(() => parseCoachingResponse(JSON.stringify(fourItems))).toThrow(/schema/);
  });

  it("throws when coachPersonaResponse is missing", () => {
    const withoutPersona = { ...validOutput, coachPersonaResponse: undefined };
    expect(() => parseCoachingResponse(JSON.stringify(withoutPersona))).toThrow(/schema/);
  });
});
