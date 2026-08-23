import { describe, expect, it } from "vitest";
import championEmoji from "@/domains/quiz/data/championEmoji.json";
import { EMOJI_PER_CHAMPION, clueLadder, nextClueNote } from "./clueLadder";

describe("clueLadder", () => {
  it("gives Classic no ladder — the grid is the clue", () => {
    expect(clueLadder("classic", 0)).toEqual([]);
    expect(clueLadder("classic", 9)).toEqual([]);
  });

  it("unlocks the opening clue before a single guess", () => {
    const [first] = clueLadder("quote", 0);
    expect(first).toMatchObject({ at: 0, unlocked: true });
  });

  it("holds the region back until the fifth miss, matching hintFor", () => {
    const at4 = clueLadder("lore", 4).find((step) => step.at === 5);
    const at5 = clueLadder("lore", 5).find((step) => step.at === 5);
    expect(at4?.unlocked).toBe(false);
    expect(at5?.unlocked).toBe(true);
  });

  it("promises exactly as many emoji as the data actually carries", () => {
    const sizes = new Set(
      Object.values(championEmoji as Record<string, string[]>).map((e) => e.length)
    );
    expect(sizes).toEqual(new Set([EMOJI_PER_CHAMPION]));
    expect(clueLadder("emoji", 0).filter((step) => step.at < 5)).toHaveLength(EMOJI_PER_CHAMPION);
  });

  it("opens the splash crop step by step and ends on the full art", () => {
    const unlockedAt = (misses: number) =>
      clueLadder("splash", misses).filter((step) => step.unlocked).length;
    expect(unlockedAt(0)).toBe(1);
    expect(unlockedAt(2)).toBe(2);
    expect(unlockedAt(6)).toBe(5);
  });
});

describe("nextClueNote", () => {
  it("counts down to the next unlock", () => {
    expect(nextClueNote("splash", 0)).toBe("Next clue after 2 more misses");
    expect(nextClueNote("splash", 1)).toBe("Next clue on your next miss");
  });

  it("says so once the ladder is spent", () => {
    expect(nextClueNote("quote", 8)).toBe("Every clue is out — the rest is on you");
  });

  it("has nothing to promise for Classic", () => {
    expect(nextClueNote("classic", 0)).toBe("Every clue is out — the rest is on you");
  });
});
