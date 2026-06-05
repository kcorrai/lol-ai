import { describe, it, expect } from "vitest";
import { buildCounterSystemPrompt, buildCounterUserPrompt } from "./counterPrompt";

describe("buildCounterSystemPrompt", () => {
  it("returns a non-empty string", () => {
    expect(buildCounterSystemPrompt().length).toBeGreaterThan(0);
  });

  it("mentions AI disclaimer", () => {
    const prompt = buildCounterSystemPrompt();
    expect(prompt).toContain("AI tahminidir");
  });

  it("instructs to respond in JSON format", () => {
    const prompt = buildCounterSystemPrompt();
    expect(prompt).toMatch(/json/i);
  });
});

describe("buildCounterUserPrompt", () => {
  it("includes the champion name in the prompt", () => {
    const prompt = buildCounterUserPrompt("Yasuo", "MIDDLE");
    expect(prompt).toContain("Yasuo");
  });

  it("includes the role label in the prompt", () => {
    const prompt = buildCounterUserPrompt("Yasuo", "MIDDLE");
    expect(prompt).toContain("Mid Lane");
  });

  it("uses correct label for each role", () => {
    expect(buildCounterUserPrompt("X", "TOP")).toContain("Top Lane");
    expect(buildCounterUserPrompt("X", "JUNGLE")).toContain("Jungle");
    expect(buildCounterUserPrompt("X", "BOTTOM")).toContain("Bot Lane");
    expect(buildCounterUserPrompt("X", "UTILITY")).toContain("Support");
  });

  it("requests topCounters, easyCounters and soloQueueCounters fields", () => {
    const prompt = buildCounterUserPrompt("Yasuo", "MIDDLE");
    expect(prompt).toContain("topCounters");
    expect(prompt).toContain("easyCounters");
    expect(prompt).toContain("soloQueueCounters");
  });

  it("requests JSON format output", () => {
    const prompt = buildCounterUserPrompt("Yasuo", "MIDDLE");
    expect(prompt).toMatch(/json/i);
  });

  it("includes patchNote disclaimer in instructions", () => {
    const prompt = buildCounterUserPrompt("Yasuo", "MIDDLE");
    expect(prompt).toContain("patchNote");
  });
});
