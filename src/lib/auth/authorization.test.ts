import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: { findFirst: vi.fn(), count: vi.fn() },
    subscription: { findUnique: vi.fn() },
    coachingReport: { count: vi.fn() },
  },
}));

import {
  assertOwnsRiotAccount,
  assertCanAddRiotAccount,
  assertCanDisconnectRiotAccount,
  assertCanGenerateReport,
  checkIsPro,
} from "./authorization";
import { prisma } from "@/lib/db/prisma";

const userId = "user-1";
const riotAccountId = "acc-1";

/** Drives getPlanLimits, which every assert in this module reads through. */
function onPlan(plan: string | null, status = "active") {
  vi.mocked(prisma.subscription.findUnique).mockResolvedValue(
    plan === null ? null : ({ plan, status } as never)
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  onPlan(null);
});

describe("assertOwnsRiotAccount", () => {
  it("passes when the account belongs to the user", async () => {
    vi.mocked(prisma.riotAccount.findFirst).mockResolvedValue({ id: riotAccountId } as never);

    await expect(assertOwnsRiotAccount(userId, riotAccountId)).resolves.toBeUndefined();
  });

  // The IDOR case: the lookup is scoped by userId, so another user's id simply
  // does not match and the query returns null.
  it("throws when the account belongs to someone else", async () => {
    vi.mocked(prisma.riotAccount.findFirst).mockResolvedValue(null as never);

    await expect(assertOwnsRiotAccount(userId, "someone-elses-account")).rejects.toThrow();
  });

  // Scoping by userId in the WHERE clause is the whole defence — a query that
  // fetched by id alone and compared afterwards would be far easier to get wrong.
  it("scopes the lookup by userId rather than filtering after the fact", async () => {
    vi.mocked(prisma.riotAccount.findFirst).mockResolvedValue({ id: riotAccountId } as never);

    await assertOwnsRiotAccount(userId, riotAccountId);

    expect(prisma.riotAccount.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: riotAccountId, userId } })
    );
  });
});

describe("assertCanAddRiotAccount", () => {
  it.each([
    ["free", "free", 1],
    ["pro", "pro", 3],
    ["elite", "elite", 5],
  ])("throws on %s once the account limit is reached", async (_label, plan, limit) => {
    onPlan(plan);
    vi.mocked(prisma.riotAccount.count).mockResolvedValue(limit as never);

    await expect(assertCanAddRiotAccount(userId)).rejects.toThrow();
  });

  it("allows the last slot below the limit", async () => {
    onPlan("pro");
    vi.mocked(prisma.riotAccount.count).mockResolvedValue(2 as never);

    await expect(assertCanAddRiotAccount(userId)).resolves.toBeUndefined();
  });
});

describe("assertCanDisconnectRiotAccount", () => {
  // Free plan allows exactly one account, so disconnect+reconnect cycling would
  // let a single seat scrape unlimited accounts. The lock is deliberate.
  it("blocks disconnecting on the free plan", async () => {
    onPlan(null);

    await expect(assertCanDisconnectRiotAccount(userId)).rejects.toThrow();
  });

  it.each(["pro", "elite", "team"])("allows disconnecting on %s", async (plan) => {
    onPlan(plan);

    await expect(assertCanDisconnectRiotAccount(userId)).resolves.toBeUndefined();
  });
});

describe("checkIsPro", () => {
  it.each([
    ["pro", "active", true],
    ["elite", "active", true],
    ["team", "active", true],
    ["pro", "trialing", true],
    ["free", "active", false],
    ["pro", "canceled", false],
    ["pro", "past_due", false],
    ["elite", "unpaid", false],
  ])("plan=%s status=%s → %s", async (plan, status, expected) => {
    onPlan(plan, status);

    await expect(checkIsPro(userId)).resolves.toBe(expected);
  });

  it("returns false when the user has no subscription row", async () => {
    onPlan(null);

    await expect(checkIsPro(userId)).resolves.toBe(false);
  });
});

describe("assertCanGenerateReport", () => {
  /**
   * count() is called for the month first, then the day.
   *
   * Resets before queueing: vi.clearAllMocks() clears recorded calls but NOT
   * pending mockResolvedValueOnce values, and a test that throws on the monthly
   * check never consumes its queued daily value. Without this reset that
   * leftover shifts every later test's reads by one, making results depend on
   * declaration order.
   */
  function counts(month: number, day: number) {
    vi.mocked(prisma.coachingReport.count)
      .mockReset()
      .mockResolvedValueOnce(month as never)
      .mockResolvedValueOnce(day as never);
  }

  it("allows a free user below both caps", async () => {
    onPlan(null);
    counts(0, 0);

    await expect(assertCanGenerateReport(userId)).resolves.toBeUndefined();
  });

  it("throws at the free monthly cap of 3", async () => {
    onPlan(null);
    counts(3, 0);

    await expect(assertCanGenerateReport(userId)).rejects.toThrow();
  });

  // The daily cap exists so a free user cannot burn the whole monthly quota in
  // one sitting — it must fire even when the monthly count is still under.
  it("throws at the free daily cap of 1 even when the month is not exhausted", async () => {
    onPlan(null);
    counts(1, 1);

    await expect(assertCanGenerateReport(userId)).rejects.toThrow();
  });

  it("allows the third report of the month when today is still clear", async () => {
    onPlan(null);
    counts(2, 0);

    await expect(assertCanGenerateReport(userId)).resolves.toBeUndefined();
  });

  // -1 means unlimited; a naive `count >= limit` would reject every paid user.
  it("does not cap paid plans, and skips the count queries entirely", async () => {
    onPlan("pro");

    await expect(assertCanGenerateReport(userId)).resolves.toBeUndefined();
    expect(prisma.coachingReport.count).not.toHaveBeenCalled();
  });

  it("counts only complete and pending reports, scoped to the user's accounts", async () => {
    onPlan(null);
    counts(0, 0);

    await assertCanGenerateReport(userId);

    expect(prisma.coachingReport.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          riotAccount: { userId },
          status: { in: ["complete", "pending"] },
        }),
      })
    );
  });
});
