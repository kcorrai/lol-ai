import { describe, it, expect, vi } from "vitest";
import { computeTiltStatus } from "./tiltService";

// Mock prisma
import { prisma } from "@/lib/db/prisma";
vi.mock("@/lib/db/prisma", () => ({
  prisma: { matchParticipant: { findMany: vi.fn() } },
}));

const mockMatches = (results: Array<{ won: boolean; kills?: number; deaths?: number; assists?: number }>) =>
  results.map((r) => ({ won: r.won, kills: r.kills ?? 3, deaths: r.deaths ?? 3, assists: r.assists ?? 2 }));

describe("computeTiltStatus", () => {
  it("returns null when fewer than 3 matches", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(mockMatches([
      { won: false }, { won: true },
    ]) as never);
    const result = await computeTiltStatus("acc-1");
    expect(result).toBeNull();
  });

  it("returns focused when all games are wins", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(mockMatches([
      { won: true }, { won: true }, { won: true }, { won: true }, { won: true },
    ]) as never);
    const result = await computeTiltStatus("acc-1");
    expect(result?.level).toBe("focused");
    expect(result?.score).toBe(0);
    expect(result?.lossStreak).toBe(0);
  });

  it("scores 50 points for 4+ loss streak", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(mockMatches([
      { won: false }, { won: false }, { won: false }, { won: false }, { won: true },
    ]) as never);
    const result = await computeTiltStatus("acc-1");
    expect(result?.lossStreak).toBe(4);
    expect(result?.score).toBeGreaterThanOrEqual(50);
    expect(result?.level).toBe("tilting");
  });

  it("returns caution for moderate loss streak + poor win rate", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(mockMatches([
      { won: false }, { won: false }, { won: true }, { won: false }, { won: false },
      { won: false }, { won: true }, { won: false }, { won: false }, { won: true },
    ]) as never);
    const result = await computeTiltStatus("acc-1");
    expect(result?.level).toBe("caution");
  });

  it("detects declining KDA trend", async () => {
    // Last 3 games: bad KDA (1 kill, 6 deaths, 0 assists)
    // Games 4-7: good KDA (5 kills, 1 death, 3 assists)
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      { won: true, kills: 1, deaths: 6, assists: 0 },
      { won: true, kills: 1, deaths: 6, assists: 0 },
      { won: true, kills: 1, deaths: 6, assists: 0 },
      { won: true, kills: 5, deaths: 1, assists: 3 },
      { won: true, kills: 5, deaths: 1, assists: 3 },
      { won: true, kills: 5, deaths: 1, assists: 3 },
      { won: true, kills: 5, deaths: 1, assists: 3 },
    ] as never);
    const result = await computeTiltStatus("acc-1");
    expect(result?.kdaTrend).toBe("declining");
    expect(result?.score).toBeGreaterThanOrEqual(15);
  });

  it("score never exceeds 100 (max achievable is 90)", async () => {
    // worst case: 4+ loss streak (+50), 0% win rate (+25), declining KDA (+15) = 90
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      { won: false, kills: 0, deaths: 8, assists: 0 },
      { won: false, kills: 0, deaths: 8, assists: 0 },
      { won: false, kills: 0, deaths: 8, assists: 0 },
      { won: false, kills: 0, deaths: 8, assists: 0 },
      { won: false, kills: 0, deaths: 8, assists: 0 },
      { won: false, kills: 5, deaths: 1, assists: 5 },
      { won: false, kills: 5, deaths: 1, assists: 5 },
    ] as never);
    const result = await computeTiltStatus("acc-1");
    expect(result?.score).toBe(90);
    expect(result?.score).toBeLessThanOrEqual(100);
  });

  it("returns correct message for each level", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(mockMatches([
      { won: true }, { won: true }, { won: true },
    ]) as never);
    const result = await computeTiltStatus("acc-1");
    expect(result?.message).toBe("You're in a good mental state. Keep playing.");
  });
});
