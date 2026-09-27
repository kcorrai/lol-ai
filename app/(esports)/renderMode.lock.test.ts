import { describe, expect, it } from "vitest";
import { declaresRenderMode, renderModeCases } from "@/test/renderModeLock";

// The lock on how an esports page renders — see src/test/renderModeLock.ts for the rule and why.
const cases = renderModeCases(__dirname);

describe("esports page render mode", () => {
  it("finds the ISR esports pages", () => {
    expect(cases.length).toBeGreaterThan(5);
  });

  it.each(cases.map((c) => [c.file, c] as const))("%s declares it", (_file, c) => {
    expect(declaresRenderMode(c), `expected export const dynamic = "${c.expected}"`).toBe(true);
  });
});
