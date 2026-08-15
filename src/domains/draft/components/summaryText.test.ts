import { describe, expect, it } from "vitest";
import { makeSeries } from "@/test/draftFixtures";
import type { DraftTeam } from "@/domains/meta";
import type { DraftActionState, DraftGameState } from "@/domains/draft";
import { analyzerUrl, buildSummaryText, encodeTeam } from "./summaryText";

const BLUE: DraftTeam = {
  TOP: "Ornn",
  JUNGLE: "Vi",
  MIDDLE: "Ahri",
  BOTTOM: "Jinx",
  UTILITY: "Thresh",
};
const RED: DraftTeam = { TOP: "Darius", MIDDLE: "Zed" };

function action(
  step: number,
  side: DraftActionState["side"],
  championKey: string | null
): DraftActionState {
  return { step, side, kind: "BAN", championKey, timedOut: false };
}

const GAME: DraftGameState = {
  gameNumber: 2,
  blueTeam: 1,
  phase: "COMPLETE",
  step: 20,
  blueReady: true,
  redReady: true,
  turnStartedAt: null,
  winnerSide: "BLUE",
  version: 21,
  actions: [action(0, "BLUE", "Yuumi"), action(1, "RED", "Kalista"), action(2, "BLUE", null)],
};

describe("encodeTeam", () => {
  it("writes lanes in draft order, leaving gaps empty", () => {
    expect(encodeTeam(BLUE)).toBe("Ornn,Vi,Ahri,Jinx,Thresh");
    expect(encodeTeam(RED)).toBe("Darius,,Zed,,");
    expect(encodeTeam({})).toBe(",,,,");
  });
});

describe("analyzerUrl", () => {
  it("hands both comps to the existing analyser", () => {
    const url = analyzerUrl(BLUE, RED);
    expect(url.startsWith("/tools/draft-analyzer?")).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("blue")).toBe("Ornn,Vi,Ahri,Jinx,Thresh");
    expect(params.get("red")).toBe("Darius,,Zed,,");
  });
});

describe("buildSummaryText", () => {
  const state = makeSeries({ gameCount: 3 });
  const text = buildSummaryText(
    state,
    GAME,
    BLUE,
    RED,
    "Blue has the stronger comp.",
    "https://x/y"
  );

  it("names both sides by the team on them", () => {
    expect(text).toContain("Team 1 (blue) vs Team 2 (red) — game 2");
  });

  it("lists each comp by lane", () => {
    expect(text).toContain("Team 1: Top Ornn · Jungle Vi · Mid Ahri · Bot Jinx · Support Thresh");
    expect(text).toContain("Team 2: Top Darius · Mid Zed");
  });

  it("lists bans, showing a passed ban as a dash", () => {
    expect(text).toContain("bans: Yuumi, —");
    expect(text).toContain("bans: Kalista");
  });

  it("includes the verdict and the spectator link", () => {
    expect(text).toContain("Blue has the stronger comp.");
    expect(text).toContain("https://x/y");
  });

  it("copes with a comp that has no picks and no verdict", () => {
    const bare = buildSummaryText(state, { ...GAME, actions: [] }, {}, {}, null, "https://x/y");
    expect(bare).toContain("Team 1: no picks");
    expect(bare).toContain("bans: none");
    expect(bare).not.toContain("undefined");
  });

  it("follows the side swap rather than the team order", () => {
    const swapped = buildSummaryText(
      state,
      { ...GAME, blueTeam: 2 },
      BLUE,
      RED,
      null,
      "https://x/y"
    );
    expect(swapped).toContain("Team 2 (blue) vs Team 1 (red)");
  });
});
