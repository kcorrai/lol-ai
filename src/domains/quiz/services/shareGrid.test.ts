import { describe, it, expect } from "vitest";
import { buildShareGrid, type ModeResult } from "./shareGrid";
import { allChampions } from "./championPool";

const solved = (mode: ModeResult["mode"], guessCount: number): ModeResult => ({
  mode,
  guessCount,
  solved: true,
});

describe("buildShareGrid", () => {
  it("leads with the puzzle number and ends with the link", () => {
    const text = buildShareGrid({ puzzleNumber: 959, results: [solved("classic", 3)], streak: 4 });
    expect(text.split("\n")[0]).toBe("LaneIQ Daily #959");
    expect(text.split("\n").at(-1)).toBe("laneiq.gg/quiz");
  });

  it("names no champion — the whole point is that it can be posted early", () => {
    const text = buildShareGrid({
      puzzleNumber: 959,
      results: [solved("classic", 3), solved("splash", 1)],
      streak: 9,
    }).toLowerCase();
    for (const champion of allChampions()) {
      expect(text, champion.name).not.toContain(champion.name.toLowerCase());
    }
  });

  it("shows one amber per miss and a green for the guess that landed", () => {
    const text = buildShareGrid({ puzzleNumber: 1, results: [solved("classic", 3)], streak: 0 });
    expect(text).toContain("🟨🟨🟩 3");
  });

  it("solving first try is a lone green", () => {
    const text = buildShareGrid({ puzzleNumber: 1, results: [solved("ability", 1)], streak: 0 });
    expect(text).toContain("🟩 1");
  });

  it("marks a mode that was given up on with a black square and an X", () => {
    const text = buildShareGrid({
      puzzleNumber: 1,
      results: [{ mode: "emoji", guessCount: 4, solved: false }],
      streak: 0,
    });
    expect(text).toContain("⬛ X");
  });

  it("caps a disastrous run instead of pasting a wall of squares", () => {
    const text = buildShareGrid({ puzzleNumber: 1, results: [solved("lore", 40)], streak: 0 });
    const line = text.split("\n").find((l) => l.startsWith("LORE"))!;
    expect(line).toContain("…");
    expect((line.match(/🟨/g) ?? []).length).toBeLessThanOrEqual(6);
    // The real count still gets reported, so the cap costs no information.
    expect(line).toMatch(/40$/);
  });

  it("omits modes the player never opened", () => {
    const text = buildShareGrid({ puzzleNumber: 1, results: [solved("classic", 2)], streak: 1 });
    expect(text).toContain("CLASSIC");
    expect(text).not.toContain("SPLASH");
  });

  it("keeps the rows in a fixed order however the results arrive", () => {
    const text = buildShareGrid({
      puzzleNumber: 1,
      results: [solved("emoji", 1), solved("classic", 2), solved("splash", 3)],
      streak: 0,
    });
    const order = text
      .split("\n")
      .filter((l) => /^[A-Z]+\s/.test(l))
      .map((l) => l.split(" ")[0]);
    expect(order).toEqual(["CLASSIC", "SPLASH", "EMOJI"]);
  });

  it("shows the streak only once there is one", () => {
    expect(
      buildShareGrid({ puzzleNumber: 1, results: [solved("classic", 1)], streak: 7 })
    ).toContain("🔥 7");
    expect(
      buildShareGrid({ puzzleNumber: 1, results: [solved("classic", 1)], streak: 0 })
    ).not.toContain("🔥");
  });

  it("says so rather than printing an empty card when nothing was played", () => {
    expect(buildShareGrid({ puzzleNumber: 1, results: [], streak: 0 })).toContain(
      "nothing solved yet"
    );
  });

  it("aligns the labels so the squares line up in a monospace paste", () => {
    const text = buildShareGrid({
      puzzleNumber: 1,
      results: [solved("classic", 1), solved("lore", 1)],
      streak: 0,
    });
    const [a, b] = text.split("\n").filter((l) => l.includes("🟩"));
    expect(a.indexOf("🟩")).toBe(b.indexOf("🟩"));
  });
});
