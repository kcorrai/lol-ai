import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/cache/redisCache", () => ({
  redisCacheGet: vi.fn(),
  redisCacheSet: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { redisCacheGet, redisCacheSet } from "@/lib/cache/redisCache";
import { getSessionVersion, rememberSessionVersion } from "./sessionVersion";

const USER = "user-1";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(redisCacheGet).mockResolvedValue(null);
  vi.mocked(redisCacheSet).mockResolvedValue(true as never);
});

/**
 * These assert a security control, so they are written from the direction that matters: what
 * has to keep being true for a revoked session to stay revoked. The speed this module buys is
 * the second test; every other one is about not trading correctness for it.
 */
describe("getSessionVersion", () => {
  it("answers from Redis without asking Postgres", async () => {
    vi.mocked(redisCacheGet).mockResolvedValue(4);

    expect(await getSessionVersion(USER)).toBe(4);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("reads Postgres on a miss and publishes what it found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ sessionVersion: 7 } as never);

    expect(await getSessionVersion(USER)).toBe(7);
    expect(redisCacheSet).toHaveBeenCalledWith("auth:session-version:user-1", 7, 30);
  });

  /**
   * The one behaviour this must never get wrong. `redisCacheGet` reports an unreachable Redis
   * as a miss, and a miss has to mean "go and find out" — a cache that answered "no
   * revocation" because it could not reach anything would hand a revoked session straight
   * back. This is the same charitable-catch shape that ADR-045 was written about.
   */
  it("falls through to Postgres when Redis cannot answer, rather than assuming no revocation", async () => {
    vi.mocked(redisCacheGet).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ sessionVersion: 9 } as never);

    expect(await getSessionVersion(USER)).toBe(9);
    expect(prisma.user.findUnique).toHaveBeenCalledOnce();
  });

  // Upstash round-trips through JSON, so the integer can arrive as a string.
  it("accepts a version that came back as a string", async () => {
    vi.mocked(redisCacheGet).mockResolvedValue("3");

    expect(await getSessionVersion(USER)).toBe(3);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it.each([["not-a-number"], [{ sessionVersion: 2 }], [true], [1.5]])(
    "treats a cached %o as absent instead of coercing it",
    async (junk) => {
      vi.mocked(redisCacheGet).mockResolvedValue(junk as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ sessionVersion: 11 } as never);

      expect(await getSessionVersion(USER)).toBe(11);
    }
  );

  // Null, not zero: the caller reads a missing row as nothing to revoke, which is what the
  // direct Prisma read it replaced did.
  it("answers null when there is no such user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);

    expect(await getSessionVersion(USER)).toBeNull();
    expect(redisCacheSet).not.toHaveBeenCalled();
  });

  it("does not cache version zero as a miss", async () => {
    vi.mocked(redisCacheGet).mockResolvedValue(0);

    expect(await getSessionVersion(USER)).toBe(0);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe("rememberSessionVersion", () => {
  it("publishes the new version under the user's key", async () => {
    await rememberSessionVersion(USER, 12);

    expect(redisCacheSet).toHaveBeenCalledWith("auth:session-version:user-1", 12, 30);
  });

  /**
   * Both callers run this after their own revocation has already committed. If it could throw,
   * a completed sign-out-everywhere would come back to the user as a failed request — the
   * TASK-285 shape. `redisCacheSet` swallows its own failures; this proves nothing here undoes
   * that.
   */
  it("cannot fail the revocation that called it", async () => {
    vi.mocked(redisCacheSet).mockResolvedValue(false as never);

    await expect(rememberSessionVersion(USER, 12)).resolves.toBeUndefined();
  });
});
