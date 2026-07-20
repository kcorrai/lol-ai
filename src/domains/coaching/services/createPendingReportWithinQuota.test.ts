import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { coachingReport: { create: vi.fn() } },
}));
vi.mock("@/lib/db/userLock", () => ({ withUserLock: vi.fn() }));
vi.mock("@/lib/auth/authorization", () => ({ assertCanGenerateReport: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { withUserLock } from "@/lib/db/userLock";
import { assertCanGenerateReport } from "@/lib/auth/authorization";
import { Errors } from "@/lib/api/errors";
import { createPendingReportWithinQuota } from "./reportService";

const USER_ID = "user-1";
const RIOT_ACCOUNT_ID = "acc-1";
const MATCH_IDS = ["match-1"];

/** Stands in for the transaction client `withUserLock` hands its callback. */
function fakeTx() {
  return { coachingReport: { create: vi.fn().mockResolvedValue({ id: "report-1" }) } };
}

function locked(tx: ReturnType<typeof fakeTx>) {
  vi.mocked(withUserLock).mockImplementation((_userId, fn) => fn(tx as never));
}

function create() {
  return createPendingReportWithinQuota(USER_ID, RIOT_ACCOUNT_ID, MATCH_IDS, "session_review");
}

beforeEach(() => {
  vi.resetAllMocks();
  locked(fakeTx());
});

/**
 * Each report is a paid LLM call, and the plan quota is the only ceiling on per-user AI spend. It
 * only holds if the count and the insert happen inside one locked transaction — otherwise
 * concurrent requests each pass a stale count (TASK-267).
 */
describe("createPendingReportWithinQuota", () => {
  it("returns the new report id", async () => {
    await expect(create()).resolves.toBe("report-1");
  });

  it("takes the lock on the requesting user", async () => {
    await create();

    expect(withUserLock).toHaveBeenCalledOnce();
    expect(vi.mocked(withUserLock).mock.calls[0][0]).toBe(USER_ID);
  });

  it("checks the quota and inserts on the same transaction client", async () => {
    const tx = fakeTx();
    locked(tx);

    await create();

    expect(assertCanGenerateReport).toHaveBeenCalledWith(USER_ID, tx);
    expect(tx.coachingReport.create).toHaveBeenCalledOnce();
    // Reaching the singleton would put the insert outside the transaction.
    expect(prisma.coachingReport.create).not.toHaveBeenCalled();
  });

  it("checks the quota before inserting, not after", async () => {
    const order: string[] = [];
    const tx = fakeTx();
    tx.coachingReport.create.mockImplementation(async () => {
      order.push("insert");
      return { id: "report-1" };
    });
    vi.mocked(assertCanGenerateReport).mockImplementation(async () => {
      order.push("check");
    });
    locked(tx);

    await create();

    expect(order).toEqual(["check", "insert"]);
  });

  it("does not insert when the quota rejects", async () => {
    const tx = fakeTx();
    locked(tx);
    vi.mocked(assertCanGenerateReport).mockRejectedValue(Errors.dailyReportLimitReached());

    await expect(create()).rejects.toThrow();
    expect(tx.coachingReport.create).not.toHaveBeenCalled();
  });

  it("stores the report as pending with the requested matches", async () => {
    const tx = fakeTx();
    locked(tx);

    await createPendingReportWithinQuota(USER_ID, RIOT_ACCOUNT_ID, MATCH_IDS, "champion_focus", "csing");

    expect(tx.coachingReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          riotAccountId: RIOT_ACCOUNT_ID,
          reportType: "champion_focus",
          focusArea: "csing",
          status: "pending",
          matchesAnalyzed: MATCH_IDS,
        },
      })
    );
  });
});
