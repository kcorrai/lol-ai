import { readdirSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The guard under ADR-043's `@/` alias.
 *
 * `@/…` resolves against this app's `src` first and the website's second — in
 * `vite.config.ts`, in `tsconfig.json`, and in `vitest.config.ts`. That is only safe while
 * no path exists under both roots. The day one does, every website component importing it
 * silently gets this app's file instead: no error, no warning, just a panel that renders
 * the wrong thing or nothing at all.
 *
 * So the invariant is asserted rather than remembered. If this fails, rename the new file
 * on the desktop side — the website's tree is the one with 1000 files and 200 importers.
 */

const desktopSrc = fileURLToPath(new URL("../../src", import.meta.url));
const webSrc = fileURLToPath(new URL("../../../src", import.meta.url));

/** Every importable module path under a root, relative and without its extension. */
function modulePaths(root: string, prefix = ""): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      found.push(...modulePaths(`${root}/${entry.name}`, relative));
      continue;
    }
    if (!/\.tsx?$/.test(entry.name)) continue;
    // A test is never imported by name, so two of them colliding is not a collision.
    if (/\.test\.tsx?$/.test(entry.name)) continue;

    found.push(relative.replace(/\.tsx?$/, ""));
  }

  return found;
}

describe("the @/ alias", () => {
  it("resolves to exactly one file, because no module path exists under both roots", () => {
    const desktop = new Set(modulePaths(desktopSrc));
    const collisions = modulePaths(webSrc).filter((path) => desktop.has(path));

    expect(collisions).toEqual([]);
  });

  /**
   * The same invariant, case-folded — which is the one the resolver actually enforces.
   *
   * `webTreeFallback` decides with `statSync`, and on Windows and macOS that answers yes to
   * a name that differs only in case. A `components/ui/Button.tsx` added here therefore
   * captures every website import of `@/components/ui/button`, and the exact-match check
   * above sees two different strings and passes. It happened: nine files landed in
   * `components/ui/` and every lifted screen stopped compiling at once, with the error
   * pointing at the website's files rather than at the new ones.
   *
   * A developer on Linux would not reproduce it and CI might not either, so the assertion
   * is what carries it rather than the filesystem.
   */
  it("holds when the filesystem ignores case, which is where this app is built", () => {
    const desktop = new Set(modulePaths(desktopSrc).map((path) => path.toLowerCase()));
    const collisions = modulePaths(webSrc).filter((path) => desktop.has(path.toLowerCase()));

    expect(collisions).toEqual([]);
  });

  /**
   * A guard that quietly stopped looking at either tree would pass for ever. This is the
   * check on the check.
   */
  it("is looking at both trees", () => {
    expect(modulePaths(desktopSrc).length).toBeGreaterThan(20);
    expect(modulePaths(webSrc).length).toBeGreaterThan(500);
  });
});
