import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config.mjs";

// TASK-307: the draft room shipped with `/draft` already claimed by a
// `permanent: true` redirect left over from the old tool URLs, so the create
// page was live, correct, and completely unreachable. A redirect always wins
// over a page, and nothing else in the suite would have noticed.

type Redirect = { source: string; destination: string; permanent: boolean };

async function redirects(): Promise<Redirect[]> {
  const config = nextConfig as { redirects?: () => Promise<Redirect[]> };
  return (await config.redirects?.()) ?? [];
}

/** Routes this feature owns and no redirect may swallow. */
const DRAFT_ROUTES = ["/draft", "/draft/abc12345"];

describe("draft routes are not shadowed by a redirect", () => {
  it("leaves every draft route reachable", async () => {
    const sources = (await redirects()).map((r) => r.source);
    for (const route of DRAFT_ROUTES) {
      expect(sources).not.toContain(route);
      // Catches a wildcard like "/draft/:path*" or "/draft/(.*)" as well.
      expect(sources.some((s) => s.startsWith("/draft/") || s === "/draft")).toBe(false);
    }
  });

  it("keeps the redirects that are still doing a job", async () => {
    const map = new Map((await redirects()).map((r) => [r.source, r.destination]));
    expect(map.get("/counter")).toBe("/tools/counter-picker");
    expect(map.get("/matchup")).toBe("/tools/matchup");
  });

  it("still leaves the draft analyser at its own URL", async () => {
    const sources = (await redirects()).map((r) => r.source);
    expect(sources).not.toContain("/tools/draft-analyzer");
  });
});
