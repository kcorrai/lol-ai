import { describe, it, expect, vi } from "vitest";
import { getMonthlyMilestone } from "./milestoneService";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    matchParticipant: { findMany: vi.fn() },
    rankedHistory: { findMany: vi.fn() },
  },
}));

function participant(
  overrides: Partial<{
    won: boolean;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    championName: string;
    gameDuration: number;
    gameStart: Date;
  }> = {}
) {
  return {
    won: overrides.won ?? true,
    kills: overrides.kills ?? 5,
    deaths: overrides.deaths ?? 2,
    assists: overrides.assists ?? 8,
    cs: overrides.cs ?? 180,
    championName: overrides.championName ?? "Jinx",
    match: {
      gameDuration: overrides.gameDuration ?? 1800,
      gameStart: overrides.gameStart ?? new Date(2026, 4, 1),
    },
  };
}

describe("getMonthlyMilestone", () => {
  it("returns null when no ranked games in the month", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([]);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);
    const result = await getMonthlyMilestone("acc-1", 2026, 5);
    expect(result).toBeNull();
  });

  it("calculates win rate, wins, losses correctly", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      participant({ won: true }),
      participant({ won: true }),
      participant({ won: false }),
      participant({ won: false }),
    ] as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);

    const result = await getMonthlyMilestone("acc-1", 2026, 5);
    expect(result).not.toBeNull();
    expect(result!.wins).toBe(2);
    expect(result!.losses).toBe(2);
    expect(result!.winRate).toBe(50);
    expect(result!.gamesPlayed).toBe(4);
  });

  it("detects best win streak correctly", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      participant({ won: false }),
      participant({ won: true }),
      participant({ won: true }),
      participant({ won: true }),
      participant({ won: false }),
      participant({ won: true }),
      participant({ won: true }),
    ] as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);

    const result = await getMonthlyMilestone("acc-1", 2026, 5);
    expect(result!.bestWinStreak).toBe(3);
  });

  it("aggregates top champions by game count", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      participant({ championName: "Jinx" }),
      participant({ championName: "Jinx" }),
      participant({ championName: "Jinx" }),
      participant({ championName: "Caitlyn" }),
      participant({ championName: "Caitlyn" }),
      participant({ championName: "Ashe" }),
    ] as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);

    const result = await getMonthlyMilestone("acc-1", 2026, 5);
    expect(result!.topChampions[0]!.name).toBe("Jinx");
    expect(result!.topChampions[0]!.games).toBe(3);
    expect(result!.topChampions[1]!.name).toBe("Caitlyn");
  });

  it("calculates LP change using rank history", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([participant()] as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([
      { tier: "GOLD", division: "II", lp: 50, recordedAt: new Date(2026, 4, 1) },
      { tier: "GOLD", division: "I", lp: 20, recordedAt: new Date(2026, 4, 14) },
    ] as never);

    const result = await getMonthlyMilestone("acc-1", 2026, 5);
    // GOLD II 50 → GOLD I 20: +70 LP (100 for div + 20 - 50)
    expect(result!.lpChange).toBe(70);
  });

  it("returns zero LP change when no rank history", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([participant()] as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);

    const result = await getMonthlyMilestone("acc-1", 2026, 5);
    expect(result!.lpChange).toBe(0);
  });

  it("includes correct month label", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([participant()] as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);

    const result = await getMonthlyMilestone("acc-1", 2026, 5);
    expect(result!.label).toBe("May 2026");
  });
});
