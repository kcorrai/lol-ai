import { beforeEach, describe, expect, it, vi } from "vitest";

// `.tsx`, so this runs in the project that transforms JSX. The route imports the quiz domain
// through its barrel, and that barrel reaches components — the node project's parser stops at
// the first tag. Keeping the domain real is worth the jsdom boot: a mocked barrel would have
// this test asserting against its own stubs rather than the URLs Data Dragon actually serves.

vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkRateLimit: vi.fn(),
}));

import { checkRateLimit } from "@/lib/api/rateLimit";
import { routeRequest } from "@/test/apiRoute";
import { GET } from "./route";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, limit: 60, remaining: 59 } as never);
  fetchMock.mockResolvedValue(
    new Response("png-bytes", { status: 200, headers: { "content-type": "image/png" } })
  );
  vi.stubGlobal("fetch", fetchMock);
});

describe("GET /api/quiz/asset/[mode]", () => {
  it("streams the artwork for a daily puzzle", async () => {
    const res = await GET(routeRequest("/api/quiz/asset/ability"), { params: { mode: "ability" } });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
  });

  it("rate limits by IP", async () => {
    await GET(
      routeRequest("/api/quiz/asset/ability", { headers: { "x-forwarded-for": "1.2.3.4" } }),
      { params: { mode: "ability" } }
    );

    expect(vi.mocked(checkRateLimit).mock.calls[0][0]).toBe("quiz-asset:1.2.3.4");
  });

  /**
   * This is the only public route that spends an outbound request per call, and a distinct
   * `seed` is a distinct URL — a cache miss by construction. Without a ceiling, walking the
   * seed space turns one visitor into unlimited origin traffic against Data Dragon, charged to
   * us. So the limit has to be checked before anything reaches the network.
   */
  it("returns 429 without reaching Data Dragon when over the limit", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 60,
      remaining: 0,
      retryAfterMs: 30_000,
    } as never);

    const res = await GET(routeRequest("/api/quiz/asset/ability"), { params: { mode: "ability" } });

    expect(res.status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a practice seed within the bound the other quiz routes use", async () => {
    const res = await GET(routeRequest("/api/quiz/asset/splash?seed=abc123"), {
      params: { mode: "splash" },
    });

    expect(res.status).toBe(200);
  });

  // `/api/quiz/today` and `/api/quiz/guess` both cap the seed at 64 characters. This route read
  // the raw parameter, so the one endpoint that does work per distinct seed was the one that
  // took a seed of any length.
  it("refuses a seed longer than the other routes allow", async () => {
    const res = await GET(routeRequest(`/api/quiz/asset/splash?seed=${"x".repeat(65)}`), {
      params: { mode: "splash" },
    });

    expect(res.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses an empty seed", async () => {
    const res = await GET(routeRequest("/api/quiz/asset/splash?seed="), {
      params: { mode: "splash" },
    });

    expect(res.status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("404s a mode it has no artwork for", async () => {
    const res = await GET(routeRequest("/api/quiz/asset/lore"), { params: { mode: "lore" } });

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
