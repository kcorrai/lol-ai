import { describe, it, expect } from "vitest";
import { buildMatchupSystemPrompt, buildMatchupUserPrompt } from "./matchupPrompt";

describe("buildMatchupSystemPrompt", () => {
  it("returns a non-empty string", () => {
    expect(buildMatchupSystemPrompt().length).toBeGreaterThan(0);
  });

  it("instructs to respond in JSON format", () => {
    expect(buildMatchupSystemPrompt()).toMatch(/json/i);
  });

  it("mentions AI disclaimer", () => {
    expect(buildMatchupSystemPrompt()).toContain("AI tahminidir");
  });
});

describe("buildMatchupUserPrompt", () => {
  it("includes the champion name", () => {
    const prompt = buildMatchupUserPrompt("Yasuo", "Zed", "MIDDLE");
    expect(prompt).toContain("Yasuo");
  });

  it("includes the opponent name", () => {
    const prompt = buildMatchupUserPrompt("Yasuo", "Zed", "MIDDLE");
    expect(prompt).toContain("Zed");
  });

  it("includes the role label", () => {
    const prompt = buildMatchupUserPrompt("Yasuo", "Zed", "MIDDLE");
    expect(prompt).toContain("Mid Lane");
  });

  it("uses correct label for each role", () => {
    expect(buildMatchupUserPrompt("X", "Y", "TOP")).toContain("Top Lane");
    expect(buildMatchupUserPrompt("X", "Y", "JUNGLE")).toContain("Jungle");
    expect(buildMatchupUserPrompt("X", "Y", "BOTTOM")).toContain("Bot Lane");
    expect(buildMatchupUserPrompt("X", "Y", "UTILITY")).toContain("Support");
  });

  it("requests laneAnalysis, tradeGuide, buildAdvice and criticalMistakes fields", () => {
    const prompt = buildMatchupUserPrompt("Yasuo", "Zed", "MIDDLE");
    expect(prompt).toContain("laneAnalysis");
    expect(prompt).toContain("tradeGuide");
    expect(prompt).toContain("buildAdvice");
    expect(prompt).toContain("criticalMistakes");
  });

  it("requests JSON format output", () => {
    const prompt = buildMatchupUserPrompt("Yasuo", "Zed", "MIDDLE");
    expect(prompt).toMatch(/json/i);
  });
});
