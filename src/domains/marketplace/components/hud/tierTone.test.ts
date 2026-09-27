import { describe, it, expect } from "vitest";
import { tierTint } from "@/domains/marketplace/components/hud/tierTone";

describe("tierTint", () => {
  it("turns a tier into its rank colour at the given opacity", () => {
    expect(tierTint("MASTER", 0.5)).toBe("rgba(155, 89, 182, 0.5)");
  });

  it("falls back to the neutral line colour for no tier or an unknown one", () => {
    expect(tierTint(null, 1)).toBe("rgba(69, 100, 96, 1)");
    expect(tierTint("WOOD", 1)).toBe("rgba(69, 100, 96, 1)");
  });
});
