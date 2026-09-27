import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn((_config: unknown, handler: unknown) => handler),
    send: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: { findUnique: vi.fn() },
    coachingReport: { count: vi.fn(), findFirst: vi.fn() },
    matchParticipant: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/auth/authorization", () => ({ getPlanLimits: vi.fn() }));
vi.mock("@/domains/riot/services/accountLookup", () => ({ getAccountPuuid: vi.fn() }));
vi.mock("@/domains/coaching/services/reportService", () => ({ createPendingReport: vi.fn() }));

import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db/prisma";
import { getPlanLimits } from "@/lib/auth/authorization";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";
import { createPendingReport } from "@/domains/coaching/services/reportService";
import { autoSessionReview } from "@/inngest/functions/autoSessionReview";

type Handler = (ctx: { event: { data: { riotAccountId: string } } }) => Promise<unknown>;
const run = autoSessionReview as unknown as Handler;

const HOUR_MS = 60 * 60 * 1000;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue({ userId: "u1" } as never);
  vi.mocked(getPlanLimits).mockResolvedValue({ reportsPerMonth: -1, reportsPerDay: -1 } as never);
  vi.mocked(getAccountPuuid).mockResolvedValue("puuid-1");
  vi.mocked(prisma.coachingReport.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
    { matchId: "m1" },
    { matchId: "m2" },
    { matchId: "m3" },
  ] as never);
  vi.mocked(createPendingReport).mockResolvedValue("report-1");
});

describe("autoSessionReview", () => {
  it("queues a report when none was made in the last day", async () => {
    const result = await run({ event: { data: { riotAccountId: "acc-1" } } });

    expect(result).toEqual({ reportId: "report-1", status: "queued" });
    expect(inngest.send).toHaveBeenCalledOnce();
  });

  it("looks back a full day for an existing report, not three hours", async () => {
    const before = Date.now();
    await run({ event: { data: { riotAccountId: "acc-1" } } });

    const where = vi.mocked(prisma.coachingReport.findFirst).mock.calls[0][0]?.where as {
      createdAt: { gte: Date };
    };
    const windowMs = before - where.createdAt.gte.getTime();
    expect(windowMs).toBeGreaterThanOrEqual(24 * HOUR_MS - 1_000);
    expect(windowMs).toBeLessThanOrEqual(24 * HOUR_MS + 1_000);
  });

  it("skips when a report already exists inside the window", async () => {
    vi.mocked(prisma.coachingReport.findFirst).mockResolvedValue({ id: "earlier" } as never);

    const result = await run({ event: { data: { riotAccountId: "acc-1" } } });

    expect(result).toEqual({ skipped: "dedup" });
    expect(createPendingReport).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
  });
});
