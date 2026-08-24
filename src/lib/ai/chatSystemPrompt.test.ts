import { describe, it, expect } from "vitest";
import { buildChatSystemPrompt, type ChatContext } from "./chatSystemPrompt";

function context(overrides: Partial<ChatContext> = {}): ChatContext {
  return {
    gameName: "KaaN",
    tagLine: "TR1",
    region: "tr1",
    rankDisplay: "GOLD II 45 LP",
    profile: {
      gamesAnalyzed: 20,
      winRate: 55,
      playstyle: "aggressive",
      strongestArea: "laning",
      weakestArea: "vision",
      mostPlayedChampions: ["Ahri", "Syndra", "Orianna"],
      avgMetrics: { kda: 3.2, csPerMinute: 6.8, avgDeathsPerGame: 4.1 },
      recentMatches: [
        {
          champion: "Ahri",
          position: "MIDDLE",
          won: true,
          kills: 8,
          deaths: 3,
          assists: 7,
          csPerMinute: 7.1,
          visionScore: 22,
        },
      ],
    } as unknown as ChatContext["profile"],
    plan: null,
    focusAction: null,
    persona: "direct",
    ...overrides,
  };
}

describe("buildChatSystemPrompt", () => {
  /**
   * Prompt caching is a prefix match and this prompt is the entire stable prefix of a chat
   * request: it is built once per conversation and resent, byte-identical, on every turn. A
   * timestamp, a random id or an unsorted map slipped in here would invalidate the cache on every
   * single turn — and nothing would break, nothing would fail, the bill would just quietly go back
   * up. That failure is invisible in production, so it is pinned here instead.
   */
  it("is byte-identical when built twice from the same context", () => {
    const first = buildChatSystemPrompt(context());
    const second = buildChatSystemPrompt(context());

    expect(first).toBe(second);
  });

  it("is byte-identical when built again a moment later", async () => {
    const first = buildChatSystemPrompt(context());
    await new Promise((resolve) => setTimeout(resolve, 25));
    const second = buildChatSystemPrompt(context());

    expect(first).toBe(second);
  });

  it("contains no date, time or clock-shaped text", () => {
    const prompt = buildChatSystemPrompt(context());

    expect(prompt).not.toMatch(/\d{4}-\d{2}-\d{2}/); // ISO date
    expect(prompt).not.toMatch(/\d{2}:\d{2}:\d{2}/); // clock time
    expect(prompt).not.toMatch(/\bGMT\b|\bUTC\b/);
  });

  it("still varies when the context it describes varies", () => {
    const gold = buildChatSystemPrompt(context({ rankDisplay: "GOLD II 45 LP" }));
    const plat = buildChatSystemPrompt(context({ rankDisplay: "PLATINUM IV 10 LP" }));

    expect(gold).not.toBe(plat);
  });

  it("varies by persona", () => {
    const direct = buildChatSystemPrompt(context({ persona: "direct" }));
    const motivational = buildChatSystemPrompt(context({ persona: "motivational" }));

    expect(direct).not.toBe(motivational);
  });
});
