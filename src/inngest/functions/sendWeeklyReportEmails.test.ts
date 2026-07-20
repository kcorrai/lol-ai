import { beforeEach, describe, expect, it, vi } from "vitest";

// The module registers an Inngest function at import time; capture the handler instead of running
// a scheduler.
vi.mock("@/inngest/client", () => ({
  inngest: { createFunction: vi.fn((_config, handler) => ({ handler })) },
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    discordIntegration: { findMany: vi.fn() },
    rankedHistory: { findMany: vi.fn() },
  },
}));
vi.mock("@/domains/coaching/services/weeklyReportService", () => ({
  sendWeeklyReports: vi.fn(),
}));
vi.mock("@/lib/discord/webhookService", () => ({ sendDiscordWebhook: vi.fn() }));
vi.mock("@/lib/discord/embeds", () => ({ weeklyRecapEmbed: vi.fn((args) => args) }));
vi.mock("@/lib/crypto/encrypt", () => ({ decryptString: vi.fn((s: string) => `decrypted:${s}`) }));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";
import { sendWeeklyReports } from "@/domains/coaching/services/weeklyReportService";
import { sendDiscordWebhook } from "@/lib/discord/webhookService";
import { sendWeeklyReportEmails } from "./sendWeeklyReportEmails";

const run = () => (sendWeeklyReportEmails as unknown as { handler: () => Promise<unknown> }).handler();

/** One Discord subscriber with a primary account that played `wins + losses` ranked games. */
function subscriber(accountId: string, currentLp: number, wins = 2, losses = 1) {
  return {
    webhookUrl: `hook-${accountId}`,
    user: {
      riotAccounts: [
        {
          id: accountId,
          gameName: `Player-${accountId}`,
          matchParticipants: [
            ...Array(wins).fill({ won: true }),
            ...Array(losses).fill({ won: false }),
          ],
          rankedHistory: [{ tier: "GOLD", division: "II", lp: currentLp }],
          championStats: [{ champion: { name: "Ahri" } }],
        },
      ],
    },
  };
}

/** A prior-rank row as the batched query returns it. */
function priorRank(riotAccountId: string, lp: number) {
  return { riotAccountId, tier: "GOLD", division: "II", lp };
}

/**
 * The embed builder is mocked to return its arguments, so the payload carries `lpDelta` even though
 * the real signature returns a `DiscordEmbed`.
 */
function sentDeltas(): number[] {
  return vi
    .mocked(sendDiscordWebhook)
    .mock.calls.map((c) => (c[1] as unknown as { lpDelta: number }).lpDelta);
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sendWeeklyReports).mockResolvedValue({ sent: 0 } as never);
  vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);
  vi.mocked(sendDiscordWebhook).mockResolvedValue(undefined as never);
});

describe("sendWeeklyReportEmails — Discord summaries", () => {
  /** The point of the task: one query per run, not one per subscriber. */
  it("looks up prior ranks once regardless of subscriber count", async () => {
    vi.mocked(prisma.discordIntegration.findMany).mockResolvedValue([
      subscriber("acc-1", 50),
      subscriber("acc-2", 50),
      subscriber("acc-3", 50),
    ] as never);

    await run();

    expect(prisma.rankedHistory.findMany).toHaveBeenCalledOnce();
    expect(sendDiscordWebhook).toHaveBeenCalledTimes(3);
  });

  it("queries every subscriber's account in that one lookup", async () => {
    vi.mocked(prisma.discordIntegration.findMany).mockResolvedValue([
      subscriber("acc-1", 50),
      subscriber("acc-2", 50),
    ] as never);

    await run();

    expect(prisma.rankedHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ riotAccountId: { in: ["acc-1", "acc-2"] } }),
      })
    );
  });

  /**
   * Batching introduces a failure mode the per-subscriber query could not have: rows getting
   * attributed to the wrong account.
   */
  it("gives each subscriber the delta from their own account", async () => {
    vi.mocked(prisma.discordIntegration.findMany).mockResolvedValue([
      subscriber("acc-1", 80),
      subscriber("acc-2", 30),
    ] as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([
      priorRank("acc-1", 50), // +30
      priorRank("acc-2", 50), // -20
    ] as never);

    await run();

    expect(sentDeltas()).toEqual([30, -20]);
  });

  it("reports a zero delta when the subscriber has no snapshot in the window", async () => {
    vi.mocked(prisma.discordIntegration.findMany).mockResolvedValue([subscriber("acc-1", 80)] as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);

    await run();

    expect(sentDeltas()).toEqual([0]);
  });

  // Rows come back newest first, so the first one seen per account is the one nearest a week ago.
  it("uses the most recent snapshot when an account has several in the window", async () => {
    vi.mocked(prisma.discordIntegration.findMany).mockResolvedValue([subscriber("acc-1", 80)] as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([
      priorRank("acc-1", 60),
      priorRank("acc-1", 10),
    ] as never);

    await run();

    expect(sentDeltas()).toEqual([20]);
  });

  // Bounded on both sides — without the lower bound a months-old row became the "week ago" baseline.
  it("bounds the lookup window at both ends", async () => {
    vi.mocked(prisma.discordIntegration.findMany).mockResolvedValue([subscriber("acc-1", 50)] as never);

    await run();

    const where = vi.mocked(prisma.rankedHistory.findMany).mock.calls[0][0]?.where as {
      recordedAt: { gte: Date; lte: Date };
    };
    expect(where.recordedAt.gte).toBeInstanceOf(Date);
    expect(where.recordedAt.lte).toBeInstanceOf(Date);
    expect(where.recordedAt.gte.getTime()).toBeLessThan(where.recordedAt.lte.getTime());
  });

  it("skips a subscriber who played no ranked games this week", async () => {
    vi.mocked(prisma.discordIntegration.findMany).mockResolvedValue([
      subscriber("acc-1", 50, 0, 0),
    ] as never);

    await run();

    expect(sendDiscordWebhook).not.toHaveBeenCalled();
  });

  it("keeps sending to the rest when one webhook fails", async () => {
    vi.mocked(prisma.discordIntegration.findMany).mockResolvedValue([
      subscriber("acc-1", 50),
      subscriber("acc-2", 50),
    ] as never);
    vi.mocked(sendDiscordWebhook).mockRejectedValueOnce(new Error("discord down"));

    await expect(run()).resolves.toBeDefined();
    expect(sendDiscordWebhook).toHaveBeenCalledTimes(2);
  });
});
