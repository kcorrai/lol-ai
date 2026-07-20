import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot/services/previewService", () => ({ buildAccountPreview: vi.fn() }));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkRateLimit: vi.fn(),
}));

import { buildAccountPreview } from "@/domains/riot/services/previewService";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { normalizeRiotError } from "@/lib/riot/errors";
import { routeRequest } from "@/test/apiRoute";
import { GET } from "./route";

const QUERY = "/api/public/preview?gameName=kaanproak0&tagLine=TR1&region=tr1";
const PREVIEW = { summoner: { gameName: "kaanproak0" }, recentMatches: [], topChampions: [] };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, limit: 10, remaining: 9 } as never);
  vi.mocked(buildAccountPreview).mockResolvedValue(PREVIEW as never);
});

describe("GET /api/public/preview", () => {
  it("returns the preview payload", async () => {
    const res = await GET(routeRequest(QUERY));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: PREVIEW });
  });

  it("rejects a missing region", async () => {
    const res = await GET(routeRequest("/api/public/preview?gameName=a&tagLine=b"));

    expect(res.status).toBe(400);
  });

  it("rejects an unknown region", async () => {
    const res = await GET(routeRequest("/api/public/preview?gameName=a&tagLine=b&region=zz9"));

    expect(res.status).toBe(400);
  });

  it("returns 429 without calling Riot when over the limit", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterMs: 60_000,
    } as never);

    const res = await GET(routeRequest(QUERY));

    expect(res.status).toBe(429);
    expect(buildAccountPreview).not.toHaveBeenCalled();
  });

  /**
   * These four cases are the regression guard for TASK-285. The route used to
   * classify failures with `err.message.includes(...)`, but normalizeRiotError
   * carries the machine-readable value on `.code` and a prose sentence on
   * `.message` — so every branch missed and all of these collapsed into a
   * generic 500. Building the errors through normalizeRiotError (rather than
   * hand-rolling them) keeps the test honest if those messages ever change.
   */
  describe("Riot error mapping", () => {
    it("maps 404 to a not-found message naming the Riot ID", async () => {
      vi.mocked(buildAccountPreview).mockRejectedValue(normalizeRiotError(404));

      const res = await GET(routeRequest(QUERY));

      expect(res.status).toBe(404);
      expect((await res.json()).error).toContain("kaanproak0#TR1");
    });

    it("maps 429 to 503", async () => {
      vi.mocked(buildAccountPreview).mockRejectedValue(normalizeRiotError(429, 5));

      const res = await GET(routeRequest(QUERY));

      expect(res.status).toBe(503);
      expect((await res.json()).error).toContain("rate limit");
    });

    it.each([401, 403])("maps %i to a 503 configuration error", async (status) => {
      vi.mocked(buildAccountPreview).mockRejectedValue(normalizeRiotError(status));

      const res = await GET(routeRequest(QUERY));

      expect(res.status).toBe(503);
      expect((await res.json()).error).toContain("configuration");
    });

    it("maps upstream 5xx to 503", async () => {
      vi.mocked(buildAccountPreview).mockRejectedValue(normalizeRiotError(502));

      const res = await GET(routeRequest(QUERY));

      expect(res.status).toBe(503);
    });

    it("falls back to 500 for a non-Riot failure", async () => {
      vi.mocked(buildAccountPreview).mockRejectedValue(new Error("boom"));

      const res = await GET(routeRequest(QUERY));

      expect(res.status).toBe(500);
      expect((await res.json()).error).toBe("Server error occurred.");
    });

    it("does not leak the internal message to the client", async () => {
      vi.mocked(buildAccountPreview).mockRejectedValue(normalizeRiotError(401));

      const res = await GET(routeRequest(QUERY));

      expect(JSON.stringify(await res.json())).not.toContain("API key");
    });
  });
});
