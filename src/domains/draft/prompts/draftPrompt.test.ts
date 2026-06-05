import { describe, it, expect } from "vitest";
import { buildDraftSystemPrompt, buildDraftUserPrompt } from "./draftPrompt";

const BLUE = { TOP: "Garen", JUNGLE: "LeeSin", MIDDLE: "Yasuo", BOTTOM: "Jinx", UTILITY: "Thresh" };
const RED = { TOP: "Darius", JUNGLE: "Vi", MIDDLE: "Zed", BOTTOM: "Caitlyn", UTILITY: "Lulu" };

describe("buildDraftSystemPrompt", () => {
  it("instructs AI to return JSON only", () => {
    const prompt = buildDraftSystemPrompt();
    expect(prompt.toLowerCase()).toContain("json");
  });

  it("conveys draft analyst persona", () => {
    const prompt = buildDraftSystemPrompt();
    expect(prompt.toLowerCase()).toMatch(/draft|komp|analist/);
  });
});

describe("buildDraftUserPrompt", () => {
  it("includes all 10 champion names in the prompt", () => {
    const prompt = buildDraftUserPrompt(BLUE, RED);
    [...Object.values(BLUE), ...Object.values(RED)].forEach((champ) => {
      expect(prompt).toContain(champ);
    });
  });

  it("includes position labels", () => {
    const prompt = buildDraftUserPrompt(BLUE, RED);
    expect(prompt).toContain("Top");
    expect(prompt).toContain("Jungle");
    expect(prompt).toContain("Mid");
  });

  it("requests TeamComposition field", () => {
    const prompt = buildDraftUserPrompt(BLUE, RED);
    expect(prompt).toContain("blueTeamComposition");
    expect(prompt).toContain("redTeamComposition");
  });

  it("requests winConditions field", () => {
    const prompt = buildDraftUserPrompt(BLUE, RED);
    expect(prompt).toContain("blueWinConditions");
    expect(prompt).toContain("redWinConditions");
  });

  it("requests scaling profile", () => {
    const prompt = buildDraftUserPrompt(BLUE, RED);
    expect(prompt).toContain("blueScaling");
    expect(prompt).toContain("redScaling");
  });

  it("requests scores in 1-10 range", () => {
    const prompt = buildDraftUserPrompt(BLUE, RED);
    expect(prompt).toMatch(/1-10/);
  });

  it("instructs AI to return JSON only", () => {
    const prompt = buildDraftUserPrompt(BLUE, RED);
    expect(prompt.toLowerCase()).toContain("json");
  });
});
