import { describe, it, expect } from "vitest";
import { buildPrompt } from "@/domains/coaching/pipeline/promptBuilder";
import type { CoachingInput } from "@/domains/coaching/types/coaching.types";

function input(overrides: Partial<CoachingInput> = {}): CoachingInput {
  return {
    player: {
      riotId: "Faker#KR1",
      region: "kr",
      currentRank: { tier: "GOLD", rank: "II", lp: 40 },
      roles: ["MIDDLE"],
    },
    analysisContext: { periodGames: 5, queueType: "RANKED_SOLO_5x5", focusArea: "laning" },
    matches: [],
    aggregateStats: {} as CoachingInput["aggregateStats"],
    rankBenchmarks: null,
    championPool: [],
    ...overrides,
  };
}

describe("buildPrompt", () => {
  it("keeps the system prompt identical across players so it can be served from the prompt cache", () => {
    const a = buildPrompt(input(), "session_review");
    const b = buildPrompt(
      input({
        player: { riotId: "Other#EUW", region: "euw1", currentRank: null, roles: ["JUNGLE"] },
        analysisContext: { periodGames: 3, queueType: "RANKED_SOLO_5x5" },
      }),
      "climb_roadmap"
    );

    expect(a.systemPrompt).toBe(b.systemPrompt);
    expect(a.systemPrompt).not.toContain("GOLD");
  });

  it("puts the per-player context in the user message", () => {
    const { userMessage } = buildPrompt(input(), "session_review");

    expect(userMessage).toContain("Player is currently GOLD II (40 LP).");
    expect(userMessage).toContain("Focus area requested by player: laning.");
  });

  it("tells the model how many games it is reading", () => {
    expect(buildPrompt(input(), "session_review").userMessage).toContain(
      "Analyze the last 5 games as a session."
    );
    expect(
      buildPrompt(
        input({ analysisContext: { periodGames: 4, queueType: "ARAM" } }),
        "session_review"
      ).userMessage
    ).toContain("Analyze these 4 ARAM games.");
  });

  it("sends the player data without indentation", () => {
    const data = input();
    const { userMessage } = buildPrompt(data, "session_review");

    expect(userMessage.endsWith(JSON.stringify(data))).toBe(true);
    expect(userMessage).not.toContain('\n  "player"');
  });

  it("adds the fixed ARAM rules to the system prompt for ARAM games", () => {
    const aram = buildPrompt(
      input({ analysisContext: { periodGames: 5, queueType: "ARAM" } }),
      "session_review"
    );

    expect(aram.systemPrompt).toContain("ARAM-SPECIFIC RULES");
    expect(aram.userMessage).toContain("QUEUE TYPE: ARAM");
  });
});
