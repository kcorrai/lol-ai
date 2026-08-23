import { describe, expect, it } from "vitest";
import { winRateDelta, MIN_DELTA_GAMES } from "./winRateDelta";

const GAMES = MIN_DELTA_GAMES;

describe("winRateDelta", () => {
  it("reads a build above the champion's own baseline as an improvement", () => {
    expect(winRateDelta(53.7, 53.1, GAMES)).toMatchObject({
      points: 0.6,
      label: "+0.6",
      better: true,
    });
  });

  /** The case the whole thing exists for: a healthy-looking win rate that is below baseline. */
  it("reads a good-looking win rate below baseline as worse", () => {
    expect(winRateDelta(53.1, 53.5, GAMES)).toMatchObject({
      points: -0.4,
      label: "−0.4",
      better: false,
    });
  });

  it("uses a real minus sign, not a hyphen", () => {
    expect(winRateDelta(50, 52, GAMES)?.label).toBe("−2.0");
  });

  it("says nothing when the sample is too small to mean anything", () => {
    expect(winRateDelta(60, 50, MIN_DELTA_GAMES - 1)).toBeNull();
  });

  /** A "+0.0" chip implies a precision the data does not have. */
  it("says nothing when the difference rounds away", () => {
    expect(winRateDelta(53.12, 53.14, GAMES)).toBeNull();
    expect(winRateDelta(53.1, 53.1, GAMES)).toBeNull();
  });

  it("rounds to one decimal place", () => {
    expect(winRateDelta(53.66, 53.0, GAMES)?.label).toBe("+0.7");
  });
});
