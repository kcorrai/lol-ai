import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";
import { userLockKey, withUserLock } from "./userLock";

const USER_ID = "11111111-2222-3333-4444-555555555555";

/** Stands in for the transaction client Prisma hands the interactive-transaction callback. */
function fakeTx() {
  return { $executeRaw: vi.fn().mockResolvedValue(1) };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("userLockKey", () => {
  it("is deterministic for the same user", () => {
    expect(userLockKey(USER_ID)).toBe(userLockKey(USER_ID));
  });

  it("differs between users", () => {
    expect(userLockKey("user-a")).not.toBe(userLockKey("user-b"));
  });

  // Advisory locks take a bigint. Reading the digest as *unsigned* would overflow Postgres's
  // signed range and be rejected at runtime rather than here.
  // (BigInt literals need an ES2020 target; tsconfig is below that, hence the constructor calls.)
  it("fits in a signed 64-bit integer", () => {
    const MIN = BigInt("-9223372036854775808");
    const MAX = BigInt("9223372036854775807");

    for (const id of [USER_ID, "user-a", "user-b", ""]) {
      const key = userLockKey(id);
      expect(key).toBeGreaterThanOrEqual(MIN);
      expect(key).toBeLessThanOrEqual(MAX);
    }
  });
});

describe("withUserLock", () => {
  it("runs the callback inside a transaction", async () => {
    const tx = fakeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn) => (fn as never as (t: unknown) => Promise<unknown>)(tx) as never);

    const result = await withUserLock(USER_ID, async () => "done");

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(result).toBe("done");
  });

  it("hands the callback the same transaction client the lock was taken on", async () => {
    const tx = fakeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn) => (fn as never as (t: unknown) => Promise<unknown>)(tx) as never);

    let received: unknown;
    await withUserLock(USER_ID, async (received_) => {
      received = received_;
    });

    expect(received).toBe(tx);
  });

  // The whole point of the primitive. A single-threaded test cannot observe the race, so the
  // ordering of these two calls IS the contract — assert it directly (same reasoning as the
  // timingSafeEqual coverage in TASK-263).
  it("acquires the advisory lock before running the callback", async () => {
    const tx = fakeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn) => (fn as never as (t: unknown) => Promise<unknown>)(tx) as never);

    const order: string[] = [];
    tx.$executeRaw.mockImplementation(async () => {
      order.push("lock");
      return 1;
    });

    await withUserLock(USER_ID, async () => {
      order.push("callback");
    });

    expect(order).toEqual(["lock", "callback"]);
  });

  it("locks on the calling user's key", async () => {
    const tx = fakeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn) => (fn as never as (t: unknown) => Promise<unknown>)(tx) as never);

    await withUserLock(USER_ID, async () => undefined);

    // Tagged-template call: (strings, ...values). The key must be a bound parameter, never
    // interpolated into the SQL text.
    const [strings, ...values] = tx.$executeRaw.mock.calls[0];
    expect(String(strings[0])).toContain("pg_advisory_xact_lock");
    expect(values).toEqual([userLockKey(USER_ID)]);
  });

  it("propagates a callback failure so the transaction rolls back", async () => {
    const tx = fakeTx();
    vi.mocked(prisma.$transaction).mockImplementation((fn) => (fn as never as (t: unknown) => Promise<unknown>)(tx) as never);

    await expect(
      withUserLock(USER_ID, async () => {
        throw new Error("insert failed");
      })
    ).rejects.toThrow("insert failed");
  });
});
