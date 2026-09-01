import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { config } from "../../middleware";

// Hoisted because `vi.mock` is: the factory below runs before this module's own body does.
const getToken = vi.hoisted(() => vi.fn());
vi.mock("next-auth/jwt", () => ({ getToken }));

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

/**
 * The rules above read the middleware as text. These run it.
 *
 * `getToken` is the only thing between the request and a decision, so mocking it is enough to
 * put the function in either state — and the assertions are about what a visitor receives,
 * which is the part a source-string test cannot reach.
 */
describe("the AI coach's front door", () => {
  async function visit(pathname: string, signedIn: boolean): Promise<NextResponse> {
    getToken.mockResolvedValue(signedIn ? { sub: "user-1" } : null);
    const { middleware } = await import("../../middleware");
    return middleware(new NextRequest(new URL(pathname, "https://lolaicoach.test")));
  }

  beforeEach(() => {
    getToken.mockReset();
  });

  it("draws the public page at /coaching instead of sending a visitor to log in", async () => {
    // The defect this whole change exists for: the product's only entry on the top bar
    // answered the person deciding whether to sign up with a form asking them to sign in.
    const res = await visit("/coaching", false);

    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-rewrite")).toContain("/ai-coach");
  });

  it("leaves the address alone while doing it", async () => {
    // A redirect would move the visitor to /ai-coach and leave the product with two URLs.
    // A rewrite keeps the one they were given, which is the one on the top bar.
    const res = await visit("/coaching", false);

    expect(res.status).toBe(200);
  });

  it("gives a signed-in player their own reports, not the pitch", async () => {
    const res = await visit("/coaching", true);

    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("location")).toBeNull();
  });

  it.each(["/coaching/chat", "/coaching/report-123"])(
    "keeps %s behind the login wall",
    async (path) => {
      // Everything under the index is one player's own games. Opening the index is not the
      // same decision as opening those, and the exact match is what keeps them apart.
      const res = await visit(path, false);
      const location = res.headers.get("location");

      expect(location).toContain("/login");
      expect(location).toContain(`callbackUrl=${encodeURIComponent(path)}`);
    }
  );
});
