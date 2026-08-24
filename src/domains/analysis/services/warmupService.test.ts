import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWarmupStatus } from "./warmupService";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { matchParticipant: { findMany: vi.fn() } },
}));

const NOW = Date.now();

function at(minsAgo: number) {
  return new Date(NOW - minsAgo * 60 * 1000);
}

// Flat rather than nested under `match`: since ADR-040 the participant row carries its own
// queue and start, and the service selects them from there.
function ranked(minsAgo: number, won = true) {
  return { won, gameStart: at(minsAgo), queueType: "RANKED_SOLO_5x5" };
}

function normal(minsAgo: number) {
  return { won: true, gameStart: at(minsAgo), queueType: "NORMAL_BLIND" };
}

function setupMocks(today: object[], historical: object[], warmupHistory: object[]) {
  vi.mocked(prisma.matchParticipant.findMany)
    .mockResolvedValueOnce(today as never)
    .mockResolvedValueOnce(historical as never)
    .mockResolvedValueOnce(warmupHistory as never);
}

describe("getWarmupStatus", () => {
  beforeEach(() => vi.resetAllMocks());
  it("returns no_ranked_today when only non-ranked games exist", async () => {
    setupMocks([normal(30)], [], []);
    const r = await getWarmupStatus("acc-1");
    expect(r.status).toBe("no_ranked_today");
  });

  it("detects warm-up when normal played within 2h before ranked", async () => {
    setupMocks([normal(90), ranked(30, true)], [ranked(30, true)], [normal(90)]);
    const r = await getWarmupStatus("acc-1");
    expect(r.status).toBe("warmed_up");
    expect(r.warmupGames).toBe(1);
    expect(r.firstRankedResult).toBe("win");
  });

  it("returns no_warmup when no normal games before ranked", async () => {
    setupMocks([ranked(30, false)], [ranked(30, false)], []);
    const r = await getWarmupStatus("acc-1");
    expect(r.status).toBe("no_warmup");
    expect(r.firstRankedResult).toBe("loss");
  });

  it("ignores normal games outside the 2h window (150min > 120min)", async () => {
    setupMocks([normal(150), ranked(20, true)], [ranked(20, true)], [normal(150)]);
    const r = await getWarmupStatus("acc-1");
    expect(r.status).toBe("no_warmup");
  });
});
