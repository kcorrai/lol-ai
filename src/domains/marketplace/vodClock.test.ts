import { describe, it, expect } from "vitest";
import { secondsToClock, clockToSeconds } from "@/domains/marketplace/vodClock";

describe("secondsToClock", () => {
  it("writes minutes and seconds the way the replay client does", () => {
    expect(secondsToClock(0)).toBe("0:00");
    expect(secondsToClock(65)).toBe("1:05");
    expect(secondsToClock(750)).toBe("12:30");
  });

  it("adds an hour field only once a game runs past one", () => {
    expect(secondsToClock(3599)).toBe("59:59");
    expect(secondsToClock(3600)).toBe("1:00:00");
    expect(secondsToClock(3725)).toBe("1:02:05");
  });

  it("floors a fractional second and clamps a negative one", () => {
    expect(secondsToClock(65.9)).toBe("1:05");
    expect(secondsToClock(-30)).toBe("0:00");
  });
});

describe("clockToSeconds", () => {
  it("reads mm:ss", () => {
    expect(clockToSeconds("12:30")).toBe(750);
    expect(clockToSeconds("0:00")).toBe(0);
  });

  it("reads h:mm:ss", () => {
    expect(clockToSeconds("1:02:05")).toBe(3725);
  });

  it("reads a bare number as seconds", () => {
    expect(clockToSeconds("90")).toBe(90);
  });

  // A coach typing fast produces both of these and plainly means the same thing.
  it("is forgiving about padding and whitespace", () => {
    expect(clockToSeconds("07:05")).toBe(425);
    expect(clockToSeconds("7:5")).toBe(425);
    expect(clockToSeconds("  7 : 5 ")).toBe(425);
  });

  // Losing the note a coach just wrote to a typo in its timestamp is the worse
  // failure, so this never throws.
  it("falls back to zero rather than failing", () => {
    expect(clockToSeconds("")).toBe(0);
    expect(clockToSeconds("early game")).toBe(0);
    expect(clockToSeconds("-5:00")).toBe(0);
  });

  it("round-trips everything the editor can produce", () => {
    for (const seconds of [0, 7, 59, 60, 61, 750, 3599, 3600, 3725, 7200]) {
      expect(clockToSeconds(secondsToClock(seconds))).toBe(seconds);
    }
  });
});
