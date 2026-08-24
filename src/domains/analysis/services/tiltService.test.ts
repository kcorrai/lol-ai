import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/db/prisma", () => ({
  prisma: { matchParticipant: { findMany: vi.fn() } },
}));
vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn(),
  buildCacheKey: (type: string, inputs: Record<string, string>) =>
    `${type}:${JSON.stringify(inputs)}`,
}));
vi.mock("@/lib/ai/client", () => ({ getAiClient: vi.fn() }));

import { computeTiltStatus, generateTiltRecoveryMessage } from "./tiltService";
import { prisma } from "@/lib/db/prisma";
import { getCached, setCached } from "@/lib/ai/aiCache";
import { getAiClient } from "@/lib/ai/client";

const mockMatches = (
  results: Array<{ won: boolean; kills?: number; deaths?: number; assists?: number }>
) =>
  results.map((r) => ({
    won: r.won,
    kills: r.kills ?? 3,
    deaths: r.deaths ?? 3,
    assists: r.assists ?? 2,
  }));

describe("computeTiltStatus", () => {
  it("returns null when fewer than 3 matches", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(
      mockMatches([{ won: false }, { won: true }]) as never
    );
    const result = await computeTiltStatus("acc-1");
    expect(result).toBeNull();
  });

  it("returns focused when all games are wins", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(
      mockMatches([
        { won: true },
        { won: true },
        { won: true },
        { won: true },
        { won: true },
      ]) as never
    );
    const result = await computeTiltStatus("acc-1");
    expect(result?.level).toBe("focused");
    expect(result?.score).toBe(0);
    expect(result?.lossStreak).toBe(0);
  });

  it("scores 50 points for 4+ loss streak", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(
      mockMatches([
        { won: false },
        { won: false },
        { won: false },
        { won: false },
        { won: true },
      ]) as never
    );
    const result = await computeTiltStatus("acc-1");
    expect(result?.lossStreak).toBe(4);
    expect(result?.score).toBeGreaterThanOrEqual(50);
    expect(result?.level).toBe("tilting");
  });

  it("returns caution for moderate loss streak + poor win rate", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(
      mockMatches([
        { won: false },
        { won: false },
        { won: true },
        { won: false },
        { won: false },
        { won: false },
        { won: true },
        { won: false },
        { won: false },
        { won: true },
      ]) as never
    );
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
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(
      mockMatches([{ won: true }, { won: true }, { won: true }]) as never
    );
    const result = await computeTiltStatus("acc-1");
    expect(result?.message).toBe("You're in a good mental state. Keep playing.");
  });
});

describe("generateTiltRecoveryMessage", () => {
  const LOSSES = [
    { championName: "Ahri", won: false, kills: 2, deaths: 8, assists: 3 },
    { championName: "Syndra", won: false, kills: 1, deaths: 6, assists: 2 },
  ];

  const complete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAiClient).mockReturnValue({ complete } as never);
    complete.mockResolvedValue({ content: '"Take a twenty minute break."' });
    vi.mocked(getCached).mockResolvedValue(null);
    vi.mocked(setCached).mockResolvedValue(undefined);
  });

  it("calls the model and stores the result on a miss", async () => {
    const message = await generateTiltRecoveryMessage(LOSSES);

    expect(message).toBe("Take a twenty minute break.");
    expect(complete).toHaveBeenCalledOnce();
    expect(vi.mocked(setCached).mock.calls[0][2]).toEqual({
      message: "Take a twenty minute break.",
    });
  });

  /**
   * This was the only AI call site in the codebase with no cache at all: two players on the same
   * losing streak with the same champions each paid for the same sentence.
   */
  it("returns the stored message without calling the model on a hit", async () => {
    vi.mocked(getCached).mockResolvedValue({ message: "Stop queueing." });

    expect(await generateTiltRecoveryMessage(LOSSES)).toBe("Stop queueing.");
    expect(complete).not.toHaveBeenCalled();
  });

  /** The key must describe the same question the prompt asks, or a hit answers the wrong one. */
  it("keys on the values that go into the prompt", async () => {
    await generateTiltRecoveryMessage(LOSSES);

    const key = vi.mocked(getCached).mock.calls[0][0];
    expect(key).toContain("Ahri, Syndra");
    expect(key).toContain('"streak":"2"');
    expect(key).toContain('"avgDeaths":"7.0"');
  });

  it("ignores a cached value of the wrong shape rather than returning it", async () => {
    vi.mocked(getCached).mockResolvedValue({ notTheMessage: 1 });

    expect(await generateTiltRecoveryMessage(LOSSES)).toBe("Take a twenty minute break.");
    expect(complete).toHaveBeenCalledOnce();
  });
});
