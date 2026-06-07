import { describe, it, expect } from "vitest";
import { currentSeasonLabel } from "./recapService";

describe("currentSeasonLabel", () => {
  it("returns a label in YYYY-SN format", () => {
    const label = currentSeasonLabel();
    expect(label).toMatch(/^\d{4}-S\d+$/);
  });

  it("includes the current year", () => {
    const label = currentSeasonLabel();
    expect(label.startsWith(String(new Date().getUTCFullYear()))).toBe(true);
  });

  it("returns a non-empty string", () => {
    expect(currentSeasonLabel().length).toBeGreaterThan(0);
  });
});
