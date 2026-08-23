import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    matchParticipant: { findFirst: vi.fn() },
    matchTimelineFrame: { findMany: vi.fn() },
    matchTimelineEvent: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { getLanePhase } from "@/domains/match/services/lanePhaseService";

/**
 * Prisma's mocked methods are typed to their whole model, while these fixtures are the narrow
 * `select` shape the service actually asks for. Cast through this rather than widening the
 * service's own types to suit the test — and without `any`, which CLAUDE.md forbids outright.
 */
function selected<T>(value: T): never {
  return value as unknown as never;
}

const MATCH = "match-db-id";
const ME = "puuid-me";
const THEM = "puuid-them";

function frame(puuid: string, minute: number, totalGold: number, xp: number, cs: number) {
  return { puuid, minute, totalGold, xp, minionsKilled: cs, jungleMinionsKilled: 0 };
}

/** Both lane participants present; `me` on team 100, opponent on 200 in the same position. */
function withBothParticipants(): void {
  vi.mocked(prisma.matchParticipant.findFirst)
    .mockResolvedValueOnce(selected({ position: "MIDDLE", teamId: 100, championName: "Ahri" }))
    .mockResolvedValueOnce(
      selected({ puuid: THEM, championName: "Zed", gameName: "Rival", tagLine: "EUW" })
    );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.matchTimelineEvent.findMany).mockResolvedValue(selected([]));
});

describe("getLanePhase", () => {
  it("differences the player against the lane opponent, minute by minute", async () => {
    withBothParticipants();
    vi.mocked(prisma.matchTimelineFrame.findMany).mockResolvedValue(
      selected([
        frame(ME, 0, 500, 0, 0),
        frame(THEM, 0, 500, 0, 0),
        frame(ME, 1, 1200, 400, 8),
        frame(THEM, 1, 1000, 300, 6),
      ])
    );

    const result = await getLanePhase(MATCH, ME);

    expect(result?.championName).toBe("Ahri");
    expect(result?.opponent?.championName).toBe("Zed");
    expect(result?.points).toEqual([
      { minute: 0, goldDiff: 0, xpDiff: 0, csDiff: 0 },
      { minute: 1, goldDiff: 200, xpDiff: 100, csDiff: 2 },
    ]);
  });

  it("counts jungle camps toward CS so a jungler's line is not flat", async () => {
    withBothParticipants();
    vi.mocked(prisma.matchTimelineFrame.findMany).mockResolvedValue(
      selected([
        {
          puuid: ME,
          minute: 1,
          totalGold: 1000,
          xp: 300,
          minionsKilled: 2,
          jungleMinionsKilled: 12,
        },
        {
          puuid: THEM,
          minute: 1,
          totalGold: 1000,
          xp: 300,
          minionsKilled: 1,
          jungleMinionsKilled: 8,
        },
      ])
    );

    const result = await getLanePhase(MATCH, ME);
    expect(result?.points[0].csDiff).toBe(5);
  });

  it("drops a minute the opponent has no frame for rather than differencing against zero", async () => {
    withBothParticipants();
    vi.mocked(prisma.matchTimelineFrame.findMany).mockResolvedValue(
      selected([
        frame(ME, 0, 500, 0, 0),
        frame(THEM, 0, 500, 0, 0),
        // The opponent has no minute 1 — a fabricated +9000 lead would be worse than a gap.
        frame(ME, 1, 9500, 400, 8),
      ])
    );

    const result = await getLanePhase(MATCH, ME);
    expect(result?.points).toHaveLength(1);
    expect(result?.points[0].minute).toBe(0);
  });

  it("returns null for a match captured before the timeline work shipped", async () => {
    withBothParticipants();
    vi.mocked(prisma.matchTimelineFrame.findMany).mockResolvedValue(selected([]));

    // Null, not an empty curve: the page must say "no record for this match", not draw a flat line.
    expect(await getLanePhase(MATCH, ME)).toBeNull();
  });

  it("returns null when the player is not in the match at all", async () => {
    vi.mocked(prisma.matchParticipant.findFirst).mockResolvedValueOnce(null);
    expect(await getLanePhase(MATCH, ME)).toBeNull();
  });

  it("still returns the shape when no lane opponent can be resolved", async () => {
    vi.mocked(prisma.matchParticipant.findFirst)
      .mockResolvedValueOnce(selected({ position: "MIDDLE", teamId: 100, championName: "Ahri" }))
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.matchTimelineFrame.findMany).mockResolvedValue(
      selected([frame(ME, 0, 500, 0, 0)])
    );

    const result = await getLanePhase(MATCH, ME);
    expect(result?.opponent).toBeNull();
    expect(result?.points).toEqual([]);
  });

  it("places markers in the minute they happened and names the side", async () => {
    withBothParticipants();
    vi.mocked(prisma.matchTimelineFrame.findMany).mockResolvedValue(
      selected([frame(ME, 0, 500, 0, 0), frame(THEM, 0, 500, 0, 0)])
    );
    vi.mocked(prisma.matchTimelineEvent.findMany).mockResolvedValue(
      selected([
        // 8:35 belongs to minute 8, not minute 9.
        { kind: "CHAMPION_KILL", timestampMs: 515_000, puuid: ME },
        { kind: "CHAMPION_KILL", timestampMs: 700_000, puuid: THEM },
      ])
    );

    const result = await getLanePhase(MATCH, ME);
    expect(result?.markers).toEqual([
      { minute: 8, kind: "CHAMPION_KILL", side: "player", label: "You died" },
      { minute: 11, kind: "CHAMPION_KILL", side: "opponent", label: "You killed your opponent" },
    ]);
  });
});
