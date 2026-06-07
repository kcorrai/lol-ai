import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildMatchupMatrix } from "./matchupService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    matchParticipant: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn().mockResolvedValue(undefined),
  buildCacheKey: vi.fn().mockReturnValue("matchup-cache-key"),
}));

import { prisma } from "@/lib/db/prisma";
import { getCached } from "@/lib/ai/aiCache";

function makeParticipant(overrides: {
  matchId: string;
  teamId: number;
  position: string;
  championName: string;
  won: boolean;
  kills?: number;
  deaths?: number;
  assists?: number;
}) {
  return {
    matchId: overrides.matchId,
    teamId: overrides.teamId,
    position: overrides.position,
    championName: overrides.championName,
    won: overrides.won,
    kills: overrides.kills ?? 3,
    deaths: overrides.deaths ?? 2,
    assists: overrides.assists ?? 4,
    riotAccountId: overrides.teamId === 100 ? "user-acc" : null,
  };
}

describe("buildMatchupMatrix", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty matrix when user has no participants", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValueOnce([]);

    const result = await buildMatchupMatrix("user-acc");

    expect(result.cells).toHaveLength(0);
    expect(result.playerChampions).toHaveLength(0);
  });

  it("returns cached result without hitting DB", async () => {
    const cached = {
      playerChampions: ["Ahri"],
      opponentChampions: ["Zed"],
      cells: [{ playerChampion: "Ahri", opponentChampion: "Zed", wins: 3, losses: 1, winRate: 75, avgKda: 3.5, gamesPlayed: 4 }],
      generatedAt: new Date().toISOString(),
      position: null,
    };
    vi.mocked(getCached).mockResolvedValueOnce(cached);

    const result = await buildMatchupMatrix("user-acc");

    expect(result).toEqual(cached);
    expect(prisma.matchParticipant.findMany).not.toHaveBeenCalled();
  });

  it("computes win rate correctly for a single matchup", async () => {
    const userParticipants = [
      makeParticipant({ matchId: "m1", teamId: 100, position: "MIDDLE", championName: "Ahri", won: true }),
      makeParticipant({ matchId: "m2", teamId: 100, position: "MIDDLE", championName: "Ahri", won: true }),
      makeParticipant({ matchId: "m3", teamId: 100, position: "MIDDLE", championName: "Ahri", won: false }),
    ];
    const opponents = [
      makeParticipant({ matchId: "m1", teamId: 200, position: "MIDDLE", championName: "Zed", won: false }),
      makeParticipant({ matchId: "m2", teamId: 200, position: "MIDDLE", championName: "Zed", won: false }),
      makeParticipant({ matchId: "m3", teamId: 200, position: "MIDDLE", championName: "Zed", won: true }),
    ];

    vi.mocked(prisma.matchParticipant.findMany)
      .mockResolvedValueOnce(userParticipants as never)
      .mockResolvedValueOnce(opponents as never);

    const result = await buildMatchupMatrix("user-acc");

    const cell = result.cells.find(
      (c) => c.playerChampion === "Ahri" && c.opponentChampion === "Zed"
    );
    expect(cell).toBeDefined();
    expect(cell!.gamesPlayed).toBe(3);
    expect(cell!.wins).toBe(2);
    expect(cell!.losses).toBe(1);
    expect(cell!.winRate).toBe(67);
  });

  it("does not match opponents on the same team", async () => {
    const userParticipants = [
      makeParticipant({ matchId: "m1", teamId: 100, position: "MIDDLE", championName: "Ahri", won: true }),
    ];
    // Same team — should be excluded
    const sameTeamParticipant = [
      makeParticipant({ matchId: "m1", teamId: 100, position: "MIDDLE", championName: "Viktor", won: true }),
    ];

    vi.mocked(prisma.matchParticipant.findMany)
      .mockResolvedValueOnce(userParticipants as never)
      .mockResolvedValueOnce(sameTeamParticipant as never);

    const result = await buildMatchupMatrix("user-acc");

    expect(result.cells).toHaveLength(0);
  });

  it("filters by position when provided", async () => {
    vi.mocked(prisma.matchParticipant.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await buildMatchupMatrix("user-acc", "TOP");

    expect(prisma.matchParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ position: "TOP" }),
      })
    );
  });

  it("limits to top 8 player champions and top 12 opponent champions", async () => {
    // Generate 15 different player champions vs 20 different opponents
    const userParticipants = Array.from({ length: 75 }, (_, i) => {
      const champIndex = Math.floor(i / 5);
      return makeParticipant({
        matchId: `m${i}`,
        teamId: 100,
        position: "MIDDLE",
        championName: `PlayerChamp${champIndex}`,
        won: true,
      });
    });
    const opponents = Array.from({ length: 75 }, (_, i) => {
      const champIndex = Math.floor(i / 5);
      return makeParticipant({
        matchId: `m${i}`,
        teamId: 200,
        position: "MIDDLE",
        championName: `OpponentChamp${champIndex}`,
        won: false,
      });
    });

    vi.mocked(prisma.matchParticipant.findMany)
      .mockResolvedValueOnce(userParticipants as never)
      .mockResolvedValueOnce(opponents as never);

    const result = await buildMatchupMatrix("user-acc");

    expect(result.playerChampions.length).toBeLessThanOrEqual(8);
    expect(result.opponentChampions.length).toBeLessThanOrEqual(12);
  });
});
