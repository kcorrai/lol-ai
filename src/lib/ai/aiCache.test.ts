import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    aiCache: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { getCached, setCached, buildCacheKey, incrementHit } from "./aiCache";
import { prisma } from "@/lib/db/prisma";

const mockPrisma = prisma as unknown as {
  aiCache: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
const pastDate = new Date(Date.now() - 1000);

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.aiCache.update.mockResolvedValue({});
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
    const diffDays =
      (expiresAt.getTime() - before.getTime()) / (1000 * 60 * 60 * 24);
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
