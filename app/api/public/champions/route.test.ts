import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({ prisma: { champion: { findMany: vi.fn() } } }));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkRateLimit: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { routeRequest } from "@/test/apiRoute";
import { GET } from "./route";

const CHAMPIONS = [{ id: "1", key: "Ahri", name: "Ahri", imageUrl: "x.png", roles: ["MIDDLE"] }];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, limit: 30, remaining: 29 } as never);
  vi.mocked(prisma.champion.findMany).mockResolvedValue(CHAMPIONS as never);
});

describe("GET /api/public/champions", () => {
  it("returns the champion catalogue", async () => {
    const res = await GET(routeRequest("/api/public/champions"));

    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual({ champions: CHAMPIONS });
  });

  /**
   * `/api/champions/all` reads the same five columns from the same table and was made cacheable in
   * TASK-278. This route was missed and additionally declared `force-dynamic`, so nothing could
   * cache it — every request was another read of a catalogue that changes once a patch, on a
   * database billed by transfer (TASK-282).
   */
  it("is cacheable", async () => {
    const res = await GET(routeRequest("/api/public/champions"));

    expect(res.headers.get("cache-control")).toContain("s-maxage=3600");
  });

  it("rate limits by IP", async () => {
    await GET(routeRequest("/api/public/champions", { headers: { "x-forwarded-for": "1.2.3.4" } }));

    expect(vi.mocked(checkRateLimit).mock.calls[0][0]).toBe("public-champs:1.2.3.4");
  });

  it("returns 429 without touching the database when over the limit", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 30,
      remaining: 0,
      retryAfterMs: 30_000,
    } as never);

    const res = await GET(routeRequest("/api/public/champions"));

    expect(res.status).toBe(429);
    expect(prisma.champion.findMany).not.toHaveBeenCalled();
  });
});
