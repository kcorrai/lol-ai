import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

/**
 * The lock on how a tool page renders (ADR-059).
 *
 * Every tool page that declares a `revalidate` has to say which of the two it is, because the
 * default decides wrongly in both directions and neither shows up in a test or a green build:
 *
 * - Left implicit, a page with a `no-cache` read under it is silently rendered per request, and
 *   the ISR it declares never happens.
 * - Left implicit, a page that reads search params is marked static whenever its
 *   `generateStaticParams` comes back empty, and then every visit fails with "static to dynamic
 *   at runtime" — which is how `/counters/[champion]` answered 500 to every request in LA-126.
 *
 * So: reads search params → `force-dynamic`; otherwise → `force-static`.
 */

const TOOLS = join(__dirname);

function pages(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) pages(full, out);
    else if (entry.name === "page.tsx") out.push(full);
  }
  return out;
}

const isrPages = pages(TOOLS)
  .map((file) => ({ file: relative(TOOLS, file), source: readFileSync(file, "utf8") }))
  .filter(({ source }) => /^export const revalidate\b/m.test(source));

describe("tool page render mode", () => {
  it("finds the ISR tool pages", () => {
    expect(isrPages.length).toBeGreaterThan(5);
  });

  it.each(isrPages.map((p) => [p.file, p.source] as const))("%s declares it", (_file, source) => {
    const readsSearchParams = /\bsearchParams\b/.test(source);
    const expected = readsSearchParams ? "force-dynamic" : "force-static";
    expect(source).toMatch(new RegExp(`^export const dynamic = "${expected}";`, "m"));
  });
});
