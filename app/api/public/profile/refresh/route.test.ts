import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot/services/preview/profileRefresh", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  refreshPublicProfile: vi.fn(),
}));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkRateLimit: vi.fn(),
}));

import { refreshPublicProfile } from "@/domains/riot/services/preview/profileRefresh";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { normalizeRiotError } from "@/lib/riot/errors";
import { routeRequest } from "@/test/apiRoute";
import { POST } from "./route";

const BODY = { gameName: "kaanproak0", tagLine: "TR1", region: "TR1" };
const post = (body: unknown) => POST(routeRequest("/api/public/profile/refresh", { body }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, limit: 10, remaining: 9 } as never);
  vi.mocked(refreshPublicProfile).mockResolvedValue({ refreshed: true, fetchedAt: null });
});

describe("POST /api/public/profile/refresh", () => {
  it("refreshes and reports it, with the region normalised", async () => {
    const res = await post(BODY);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { refreshed: true, fetchedAt: null } });
    expect(vi.mocked(refreshPublicProfile).mock.calls[0]?.slice(0, 3)).toEqual([
      "kaanproak0",
      "TR1",
      "tr1",
    ]);
  });

  it("passes a cooldown through as a normal answer", async () => {
    vi.mocked(refreshPublicProfile).mockResolvedValue({ refreshed: false, retryAfterMs: 40_000 });

    const res = await post(BODY);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { refreshed: false, retryAfterMs: 40_000 } });
  });

  it("rejects an unknown region, a missing name, or a body that is not JSON", async () => {
    expect((await post({ ...BODY, region: "zz9" })).status).toBe(400);
    expect((await post({ tagLine: "TR1", region: "tr1" })).status).toBe(400);
    expect((await post("not json")).status).toBe(400);
  });

  it("answers 429 when the visitor's fresh-lookup allowance is spent", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterMs: 90_000,
      limit: 10,
      remaining: 0,
    });
    vi.mocked(refreshPublicProfile).mockImplementation(async (_n, _t, _r, options) => {
      await options?.beforeRiot?.();
      return { refreshed: true, fetchedAt: null };
    });

    const res = await post(BODY);

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("90");
  });

  it("maps Riot throttling to 503 rather than a server error", async () => {
    vi.mocked(refreshPublicProfile).mockRejectedValue(normalizeRiotError(429));

    const res = await post(BODY);

    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("RIOT_RATE_LIMITED");
  });
});
