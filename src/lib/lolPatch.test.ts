import { describe, it, expect } from "vitest";
import { formatGamePatch, gamePatchSlug, patchNotesUrl } from "./lolPatch";

describe("formatGamePatch", () => {
  it("maps Data Dragon 16.x to in-game 26.x", () => {
    expect(formatGamePatch("16.13.1")).toBe("26.13");
    expect(formatGamePatch("16.13")).toBe("26.13");
    expect(formatGamePatch("16.14")).toBe("26.14");
  });

  it("maps the season-2025 boundary (15.x -> 25.x)", () => {
    expect(formatGamePatch("15.1")).toBe("25.1");
    expect(formatGamePatch("15.24.1")).toBe("25.24");
  });

  it("leaves pre-rename patches (< 15) unchanged", () => {
    expect(formatGamePatch("14.24")).toBe("14.24");
    expect(formatGamePatch("13.1.1")).toBe("13.1");
  });

  it("returns the input unchanged when it is not a version string", () => {
    expect(formatGamePatch("")).toBe("");
    expect(formatGamePatch("latest")).toBe("latest");
    expect(formatGamePatch("16")).toBe("16");
  });
});

describe("gamePatchSlug", () => {
  it("builds a hyphenated patch-notes slug", () => {
    expect(gamePatchSlug("16.13.1")).toBe("26-13");
    expect(gamePatchSlug("16.14")).toBe("26-14");
  });
});

describe("patchNotesUrl", () => {
  it("builds the official year-based patch-notes URL", () => {
    expect(patchNotesUrl("16.14")).toBe(
      "https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-14-notes/"
    );
  });
});
