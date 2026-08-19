import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { config } from "../../middleware";

// The path lists are internal to the middleware and there is no reason for anything else to import
// them. Read from source instead, which is also the only way to notice somebody adding an entry to
// one list and not the other.
const SOURCE = readFileSync(join(__dirname, "..", "..", "middleware.ts"), "utf8");

/** Source with comments removed, so a path quoted inside one is not mistaken for an entry. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/** The string literals assigned to a `const NAME = [...]` or `const NAME = "..."`. */
function constPaths(name: string): string[] {
  const src = stripComments(SOURCE);
  const array = src.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\]`));
  if (array) return [...array[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  const scalar = src.match(new RegExp(`const ${name} = "([^"]+)"`));
  if (scalar) return [scalar[1]];

  throw new Error(`${name} is no longer a literal in middleware.ts — update this test`);
}

/** "/dashboard/:path*" → "/dashboard" */
function matcherRoot(entry: string): string {
  return entry.replace(/\/:path\*$/, "");
}

describe("middleware auth coverage", () => {
  // Next requires config.matcher to be statically analysable at build time, so it cannot be derived
  // from PROTECTED_PATHS — the two lists have to be written out separately and kept in step by
  // hand. A path in one and not the other fails silently: either the middleware never runs for it,
  // which is a login wall quietly removed, or it runs and no rule acts on it. This test is the only
  // thing standing between that and a green build.
  it("routes every protected path through the matcher", () => {
    const roots = new Set(config.matcher.map(matcherRoot));
    const missing = constPaths("PROTECTED_PATHS").filter((p) => !roots.has(p));

    expect(
      missing,
      `guarded by PROTECTED_PATHS but the middleware never runs for them: ${missing.join(", ")}`
    ).toEqual([]);
  });

  it("acts on every path the matcher wakes it for", () => {
    const handled = new Set([
      ...constPaths("PROTECTED_PATHS"),
      ...constPaths("AUTH_PATHS"),
      // The half-authenticated landing page. Its own rule, deliberately outside both lists:
      // AUTH_PATHS would bounce a half-authenticated visitor away from the very page it sends
      // them to, and PROTECTED_PATHS would demand the session it exists to complete.
      ...constPaths("TWO_FACTOR_PATH"),
    ]);
    const stray = config.matcher.map(matcherRoot).filter((p) => !handled.has(p));

    expect(
      stray,
      `the middleware runs for these but no rule acts on them: ${stray.join(", ")}`
    ).toEqual([]);
  });

  it("reads real lists, so the assertions above cannot pass vacuously", () => {
    expect(constPaths("PROTECTED_PATHS").length).toBeGreaterThan(10);
    expect(constPaths("AUTH_PATHS").length).toBeGreaterThan(2);
    expect(config.matcher.length).toBeGreaterThan(10);
  });

  // /coaches is the public storefront and the acquisition surface for the whole marketplace. It
  // starts with /coach, which is guarded, so a bare prefix match would put a login wall in front
  // of it — the comment in the middleware says so, and this is that comment as a test.
  it("does not let the /coach rule swallow the public /coaches storefront", () => {
    const roots = config.matcher.map(matcherRoot);
    expect(roots).toContain("/coach");
    expect(roots).not.toContain("/coaches");
  });
});
