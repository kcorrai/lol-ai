import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/riot/services/previewService", () => ({
  buildPublicProfile: vi.fn(),
  publicProfileCacheKey: (n: string, t: string, r: string) => `profile:${n}:${t}:${r}`,
}));
vi.mock("@/lib/ai/aiCache", () => ({ getCached: vi.fn(), deleteCached: vi.fn() }));

import { buildPublicProfile } from "@/domains/riot/services/previewService";
import { deleteCached, getCached } from "@/lib/ai/aiCache";
import { REFRESH_COOLDOWN_MS, refreshPublicProfile } from "./profileRefresh";

const NOW = Date.parse("2026-09-27T12:00:00Z");
const agedMs = (ms: number) => ({ fetchedAt: new Date(NOW - ms).toISOString() });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(deleteCached).mockResolvedValue(undefined);
  vi.mocked(buildPublicProfile).mockResolvedValue({
    fetchedAt: "2026-09-27T12:00:00.000Z",
  } as never);
});

describe("refreshPublicProfile", () => {
  it("re-reads a profile older than the cooldown", async () => {
    vi.mocked(getCached).mockResolvedValue(agedMs(REFRESH_COOLDOWN_MS + 1) as never);

    const result = await refreshPublicProfile("faker", "KR1", "kr", {}, NOW);

    expect(deleteCached).toHaveBeenCalledWith("profile:faker:KR1:kr");
    expect(buildPublicProfile).toHaveBeenCalledWith("faker", "KR1", "kr");
    expect(result).toEqual({ refreshed: true, fetchedAt: "2026-09-27T12:00:00.000Z" });
  });

  it("keeps a profile read inside the cooldown, and says how long is left", async () => {
    vi.mocked(getCached).mockResolvedValue(agedMs(30_000) as never);
    const beforeRiot = vi.fn(async () => {});

    const result = await refreshPublicProfile("faker", "KR1", "kr", { beforeRiot }, NOW);

    expect(result).toEqual({ refreshed: false, retryAfterMs: REFRESH_COOLDOWN_MS - 30_000 });
    expect(beforeRiot).not.toHaveBeenCalled();
    expect(deleteCached).not.toHaveBeenCalled();
  });

  it("refreshes a profile cached before read times were recorded", async () => {
    vi.mocked(getCached).mockResolvedValue({} as never);

    expect(await refreshPublicProfile("faker", "KR1", "kr", {}, NOW)).toMatchObject({
      refreshed: true,
    });
  });

  it("keeps the cached copy when the visitor's gate refuses", async () => {
    vi.mocked(getCached).mockResolvedValue(null);
    const beforeRiot = vi.fn(async () => {
      throw new Error("throttled");
    });

    await expect(refreshPublicProfile("faker", "KR1", "kr", { beforeRiot }, NOW)).rejects.toThrow(
      "throttled"
    );
    expect(deleteCached).not.toHaveBeenCalled();
    expect(buildPublicProfile).not.toHaveBeenCalled();
  });

  it("treats an unreadable cache as nothing cached", async () => {
    vi.mocked(getCached).mockRejectedValue(new Error("redis down"));

    expect(await refreshPublicProfile("faker", "KR1", "kr", {}, NOW)).toMatchObject({
      refreshed: true,
    });
  });
});
