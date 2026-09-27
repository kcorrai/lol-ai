import { describe, expect, it } from "vitest";
import { currentPriority, runAsBackground } from "./priority";

describe("Riot call priority", () => {
  it("is foreground unless something says otherwise", () => {
    expect(currentPriority()).toBe("foreground");
  });

  it("is background for everything under runAsBackground, across awaits", async () => {
    const seen = await runAsBackground(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return currentPriority();
    });

    expect(seen).toBe("background");
    expect(currentPriority()).toBe("foreground");
  });
});
