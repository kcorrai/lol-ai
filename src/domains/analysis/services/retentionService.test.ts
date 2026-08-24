import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeRetentionSignals, NUDGE_MESSAGES } from "./retentionService";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { matchParticipant: { findMany: vi.fn() } },
}));

const now = Date.now();

function match(
  overrides: Partial<{
    won: boolean;
    deaths: number;
    csPerMinute: number;
    championName: string;
    gameStart: Date;
    gameEnd: Date;
  }> = {}
) {
  return {
    won: overrides.won ?? true,
    deaths: overrides.deaths ?? 2,
    csPerMinute: overrides.csPerMinute ?? 6,
    championName: overrides.championName ?? "Jinx",
    match: {
      gameStart: overrides.gameStart ?? new Date(now - 60 * 60 * 1000),
      gameEnd: overrides.gameEnd ?? new Date(now - 30 * 60 * 1000),
    },
  };
}

describe("computeRetentionSignals", () => {
  beforeEach(() => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([]);
  });

  it("returns all-false signals for empty match list", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([]);
    const result = await computeRetentionSignals("acc-1");
    expect(result.lossStreak).toBe(0);
    expect(result.hasLossStreak).toBe(false);
    expect(result.hasDeathSpike).toBe(false);
    expect(result.hasCsMinDrop).toBe(false);
    expect(result.hasTiltPattern).toBe(false);
    expect(result.hasWideChampionPool).toBe(false);
    expect(result.primaryNudge).toBeNull();
  });

  it("detects loss streak >= 3", async () => {
    // Spread game times > 30 min apart so no tilt-requeue false positive
    const t = (hoursAgo: number) => ({
      gameStart: new Date(now - hoursAgo * 60 * 60 * 1000),
      gameEnd: new Date(now - (hoursAgo - 0.5) * 60 * 60 * 1000),
    });
    vi.mocked(prisma.matchParticipant.findMany)
      .mockResolvedValueOnce([
        match({ won: false, ...t(1) }),
        match({ won: false, ...t(3) }),
        match({ won: false, ...t(5) }),
        match({ won: true, ...t(7) }),
      ] as never)
      .mockResolvedValue([]);

    const result = await computeRetentionSignals("acc-1");
    expect(result.hasLossStreak).toBe(true);
    expect(result.lossStreak).toBe(3);
    expect(result.primaryNudge).toBe("loss_streak");
  });

  it("does NOT flag loss streak when fewer than 3 consecutive losses", async () => {
    vi.mocked(prisma.matchParticipant.findMany)
      .mockResolvedValueOnce([
        match({ won: false }),
        match({ won: false }),
        match({ won: true }),
      ] as never)
      .mockResolvedValue([]);

    const result = await computeRetentionSignals("acc-1");
    expect(result.hasLossStreak).toBe(false);
  });

  it("detects death spike when last 5 avg deaths > overall avg * 1.3", async () => {
    const highDeathMatches = [
      match({ deaths: 10 }),
      match({ deaths: 9 }),
      match({ deaths: 8 }),
      match({ deaths: 9 }),
      match({ deaths: 10 }),
    ];
    const normalMatches = Array.from({ length: 7 }, () => match({ deaths: 2 }));

    vi.mocked(prisma.matchParticipant.findMany)
      .mockResolvedValueOnce([...highDeathMatches, ...normalMatches] as never)
      .mockResolvedValue([]);

    const result = await computeRetentionSignals("acc-1");
    expect(result.hasDeathSpike).toBe(true);
    expect(result.primaryNudge).toBe("death_spike");
  });

  it("detects tilt pattern (requeue < 10 min after loss, 2+ times)", async () => {
    const tiltGame1End = new Date(now - 60 * 60 * 1000);
    const tiltGame2Start = new Date(tiltGame1End.getTime() + 5 * 60 * 1000); // 5 min later
    const tiltGame2End = new Date(tiltGame2Start.getTime() + 25 * 60 * 1000);
    const tiltGame3Start = new Date(tiltGame2End.getTime() + 4 * 60 * 1000); // 4 min later
    const tiltGame3End = new Date(tiltGame3Start.getTime() + 28 * 60 * 1000);

    vi.mocked(prisma.matchParticipant.findMany)
      .mockResolvedValueOnce([
        match({ won: false, gameStart: tiltGame3Start, gameEnd: tiltGame3End }),
        match({ won: false, gameStart: tiltGame2Start, gameEnd: tiltGame2End }),
        match({ won: false, gameStart: new Date(now - 3 * 60 * 60 * 1000), gameEnd: tiltGame1End }),
      ] as never)
      .mockResolvedValue([]);

    const result = await computeRetentionSignals("acc-1");
    expect(result.hasTiltPattern).toBe(true);
    expect(result.primaryNudge).toBe("stop_queuing");
  });

  it("detects wide champion pool (>5 unique, most < 3 games)", async () => {
    const matches = [
      ...Array.from({ length: 2 }, () => match({ championName: "Jinx" })),
      ...["Caitlyn", "Ashe", "Vayne", "Ezreal", "Kogmaw", "Tristana"].map((c) =>
        match({ championName: c })
      ),
    ];

    vi.mocked(prisma.matchParticipant.findMany)
      .mockResolvedValueOnce(matches as never)
      .mockResolvedValue([]);

    const result = await computeRetentionSignals("acc-1");
    expect(result.hasWideChampionPool).toBe(true);
    expect(result.primaryNudge).toBe("pool_too_wide");
  });

  // The point of ADR-040 is that queue and recency are read off the participant row. Nothing in
  // the returned signals would change if this quietly went back through the relation — the query
  // would just get slow again, silently — so the shape itself is what is asserted.
  it("filters and orders on the participant row, not through the match relation", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([]);
    await computeRetentionSignals("acc-1");

    const [recent] = vi.mocked(prisma.matchParticipant.findMany).mock.calls[0] as [
      Record<string, unknown>,
    ];
    expect(recent.where).toMatchObject({ queueType: "RANKED_SOLO_5x5" });
    expect(recent.where).not.toHaveProperty("match");
    expect(recent.orderBy).toEqual({ gameStart: "desc" });
  });

  it("NUDGE_MESSAGES has entries for all known nudge types", () => {
    const expected = ["stop_queuing", "pool_too_wide", "loss_streak", "death_spike", "cs_drop"];
    for (const key of expected) {
      expect(NUDGE_MESSAGES[key]).toBeTruthy();
    }
  });
});
