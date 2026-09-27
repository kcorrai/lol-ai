import { describe, expect, it } from "vitest";
import { coachFloor, goalFor, quizResultPath } from "@/domains/marketplace/matchQuiz";
import type { QuizAnswers } from "@/domains/marketplace/matchQuiz";

const NONE: QuizAnswers = {
  role: null,
  tier: null,
  focus: null,
  kind: null,
  maxPrice: null,
  language: null,
};

describe("coachFloor", () => {
  it("asks for coaches one tier above the student", () => {
    expect(coachFloor("GOLD")).toBe("PLATINUM");
    expect(coachFloor("EMERALD")).toBe("DIAMOND");
  });

  it("caps the floor at Master", () => {
    expect(coachFloor("MASTER")).toBe("MASTER");
    expect(coachFloor("CHALLENGER")).toBe("MASTER");
  });

  it("sets no floor for a student who gave no rank", () => {
    expect(coachFloor(null)).toBeNull();
  });
});

describe("goalFor", () => {
  it("turns a focus area into a first line for the request", () => {
    expect(goalFor("macro")).toBe("I want to work on my macro & map decisions.");
    expect(goalFor(null)).toBe("");
  });
});

describe("quizResultPath", () => {
  it("is the bare storefront when nothing was answered", () => {
    expect(quizResultPath(NONE)).toBe("/coaches");
  });

  it("writes every answer as the storefront's own filters", () => {
    const path = quizResultPath({
      role: "JUNGLE",
      tier: "SILVER",
      focus: "laning",
      kind: "VOD_REVIEW",
      maxPrice: 40,
      language: "en",
    });
    const params = new URL(path, "https://x.test").searchParams;

    expect(params.get("role")).toBe("JUNGLE");
    expect(params.get("minTier")).toBe("GOLD");
    expect(params.get("kind")).toBe("VOD_REVIEW");
    expect(params.get("maxPrice")).toBe("40");
    expect(params.get("lang")).toBe("en");
    expect(params.get("goal")).toBe("I want to work on my laning phase.");
  });
});
