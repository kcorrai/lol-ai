import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    aiCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

// Mocked explicitly rather than left to an unconfigured environment: if
// KV_REST_API_* ever leaked into the test env, the real module would reach a live
// Upstash instance and these assertions would start describing the network.
vi.mock("@/lib/cache/redisCache", () => ({
  redisCacheGet: vi.fn(),
  redisCacheSet: vi.fn(),
  redisCacheDelete: vi.fn(),
}));

import { getCached, setCached, deleteCached, buildCacheKey, incrementHit } from "./aiCache";
import { prisma } from "@/lib/db/prisma";
import { redisCacheGet, redisCacheSet, redisCacheDelete } from "@/lib/cache/redisCache";

const mockRedisGet = redisCacheGet as unknown as ReturnType<typeof vi.fn>;
const mockRedisSet = redisCacheSet as unknown as ReturnType<typeof vi.fn>;
const mockRedisDelete = redisCacheDelete as unknown as ReturnType<typeof vi.fn>;

const mockPrisma = prisma as unknown as {
  aiCache: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
};

const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
const pastDate = new Date(Date.now() - 1000);

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.aiCache.update.mockResolvedValue({});
  mockPrisma.aiCache.deleteMany.mockResolvedValue({});
  // Default to Redis being unavailable, so the existing suite keeps describing
  // the Postgres path exactly as it did before TASK-293. Routing tests opt in.
  mockRedisGet.mockResolvedValue(null);
  mockRedisSet.mockResolvedValue(false);
  mockRedisDelete.mockResolvedValue(undefined);
});

describe("getCached", () => {
  it("returns null when entry does not exist", async () => {
    mockPrisma.aiCache.findUnique.mockResolvedValue(null);
    const result = await getCached("missing-key");
    expect(result).toBeNull();
  });

  it("returns null when entry is expired", async () => {
    mockPrisma.aiCache.findUnique.mockResolvedValue({
      cacheKey: "expired-key",
      content: { data: "old" },
      expiresAt: pastDate,
    });
    const result = await getCached("expired-key");
    expect(result).toBeNull();
  });

  it("returns content when entry is valid and not expired", async () => {
    const content = { champion: "Yasuo", counters: [] };
    mockPrisma.aiCache.findUnique.mockResolvedValue({
      cacheKey: "valid-key",
      content,
      expiresAt: futureDate,
    });
    const result = await getCached("valid-key");
    expect(result).toEqual(content);
  });

  // Inverted in TASK-282. A hitCount bump on every read turned each cache HIT
  // into an extra write round trip to Neon — the opposite of what a cache is
  // for, and a real slice of the transfer that exhausted the 5GB allowance.
  it("does not write on a cache hit", async () => {
    mockPrisma.aiCache.findUnique.mockResolvedValue({
      content: { x: 1 },
      expiresAt: futureDate,
    });

    await getCached("valid-key");
    await new Promise((r) => setTimeout(r, 0));

    expect(mockPrisma.aiCache.update).not.toHaveBeenCalled();
  });

  // The row carries id/type/hitCount/createdAt alongside a content blob that can
  // be hundreds of KB. Every unselected byte crosses the network from Neon.
  it("selects only the fields it uses", async () => {
    mockPrisma.aiCache.findUnique.mockResolvedValue({
      content: { x: 1 },
      expiresAt: futureDate,
    });

    await getCached("valid-key");

    expect(mockPrisma.aiCache.findUnique).toHaveBeenCalledWith({
      where: { cacheKey: "valid-key" },
      select: { content: true, expiresAt: true },
    });
  });
});

describe("setCached", () => {
  it("upserts with correct expiresAt for given ttlDays", async () => {
    mockPrisma.aiCache.upsert.mockResolvedValue({});
    const before = new Date();
    await setCached("new-key", "counter", { data: 1 }, 14);
    const after = new Date();

    const call = mockPrisma.aiCache.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ cacheKey: "new-key" });
    expect(call.create.type).toBe("counter");

    const expiresAt: Date = call.create.expiresAt;
    const diffDays = (expiresAt.getTime() - before.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(13.9);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(
      after.getTime() + 1000 * 60 * 60 * 24 * 14 + 1000
    );
  });
});

describe("buildCacheKey", () => {
  it("produces the same hash for identical inputs regardless of key order", () => {
    const a = buildCacheKey("counter", { champion: "yasuo", role: "MIDDLE" });
    const b = buildCacheKey("counter", { role: "MIDDLE", champion: "yasuo" });
    expect(a).toBe(b);
  });

  it("produces different hashes for different inputs", () => {
    const a = buildCacheKey("counter", { champion: "yasuo", role: "MIDDLE" });
    const b = buildCacheKey("counter", { champion: "zed", role: "MIDDLE" });
    expect(a).not.toBe(b);
  });

  it("produces different hashes for different types", () => {
    const a = buildCacheKey("counter", { champion: "yasuo" });
    const b = buildCacheKey("matchup", { champion: "yasuo" });
    expect(a).not.toBe(b);
  });

  it("normalises input values to lowercase", () => {
    const a = buildCacheKey("counter", { champion: "Yasuo" });
    const b = buildCacheKey("counter", { champion: "yasuo" });
    expect(a).toBe(b);
  });

  it("returns a 64-char hex string (sha256)", () => {
    const key = buildCacheKey("otp", { champion: "riven", role: "TOP" });
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("incrementHit", () => {
  it("calls prisma update with correct args", async () => {
    mockPrisma.aiCache.update.mockResolvedValue({});
    await incrementHit("some-key");
    expect(mockPrisma.aiCache.update).toHaveBeenCalledWith({
      where: { cacheKey: "some-key" },
      data: { hitCount: { increment: 1 } },
    });
  });
});

// TASK-293. ai_cache was 76% of the database and all of it regenerable, so cache
// entries now live in Redis and only durability fallbacks stay in Postgres.
describe("storage routing", () => {
  it("sends a cache-lifetime entry to Redis and not to Postgres", async () => {
    mockRedisSet.mockResolvedValue(true);

    await setCached("key", "matchup-guide", { a: 1 }, 7);

    expect(mockRedisSet).toHaveBeenCalledWith("key", { a: 1 }, 7 * 86400);
    // The second half of the assertion is the one that matters: writing to both
    // would put back exactly the transfer this change removes.
    expect(mockPrisma.aiCache.upsert).not.toHaveBeenCalled();
  });

  it("keeps a durability fallback in Postgres and not in Redis", async () => {
    mockRedisSet.mockResolvedValue(true);

    // SNAPSHOT_TTL_DAYS — the `:last-good` rows, read precisely when op.gg is
    // down. Redis evicts under memory pressure; that is the wrong place for the
    // copy that exists to survive an outage.
    await setCached("snapshot:last-good", "meta-snapshot", { a: 1 }, 365);

    expect(mockRedisSet).not.toHaveBeenCalled();
    expect(mockPrisma.aiCache.upsert).toHaveBeenCalled();
  });

  it("converts sub-day TTLs to seconds", async () => {
    mockRedisSet.mockResolvedValue(true);

    await setCached("key", "personal-matchups", { a: 1 }, 0.042);

    expect(mockRedisSet).toHaveBeenCalledWith("key", { a: 1 }, expect.closeTo(3628.8, 1));
  });

  it("falls back to Postgres when Redis refuses the write", async () => {
    mockRedisSet.mockResolvedValue(false);

    await setCached("key", "preview", { a: 1 }, 1);

    expect(mockPrisma.aiCache.upsert).toHaveBeenCalled();
  });

  it("reads from Redis without touching Postgres on a hit", async () => {
    mockRedisGet.mockResolvedValue({ cached: true });

    expect(await getCached("key")).toEqual({ cached: true });
    expect(mockPrisma.aiCache.findUnique).not.toHaveBeenCalled();
  });

  // Entries written before TASK-293 are still in Postgres and there is no
  // backfill, so a Redis miss has to keep reaching the database.
  it("still reads a pre-existing Postgres entry on a Redis miss", async () => {
    mockRedisGet.mockResolvedValue(null);
    mockPrisma.aiCache.findUnique.mockResolvedValue({
      content: { legacy: true },
      expiresAt: futureDate,
    });

    expect(await getCached("key")).toEqual({ legacy: true });
  });

  it("deletes from both stores", async () => {
    await deleteCached("key");

    expect(mockRedisDelete).toHaveBeenCalledWith("key");
    expect(mockPrisma.aiCache.deleteMany).toHaveBeenCalled();
  });
});
