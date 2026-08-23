import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    academyAssignment: { findFirst: vi.fn(), create: vi.fn() },
    academyProgress: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
    matchParticipant: { findMany: vi.fn() },
  },
}));

vi.mock("@/domains/riot", () => ({ listAccounts: vi.fn(), getAccountPuuid: vi.fn() }));
vi.mock("@/domains/analysis", () => ({ awardXp: vi.fn() }));
vi.mock("@/domains/otp", () => ({
  getRecommendedOtps: vi.fn(),
  getCachedOtpAnalysis: vi.fn(),
  getOtpAnalysis: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid, listAccounts } from "@/domains/riot";
import { getCachedOtpAnalysis, getRecommendedOtps } from "@/domains/otp";
import { openAssignment } from "./assignmentService";

const USER = "user-1";
const VEIGAR = "champion/veigar-mid";
const CORE = "foundations/minions-and-gold";

function matchup(opponent: string) {
  return {
    opponent,
    difficulty: "hard" as const,
    summary: `${opponent} punishes a slow start and wants the lane short.`,
    keyTip: "Hold the escape for their engage and trade after it is gone, not before.",
  };
}

const ANALYSIS = {
  champion: "Veigar",
  role: "MIDDLE",
  matchupTierList: {
    easy: [matchup("Lux")],
    medium: [matchup("Orianna"), matchup("Syndra")],
    hard: [matchup("Zed"), matchup("Fizz"), matchup("Yasuo")],
  },
  banPriority: [],
  hiddenMechanics: [],
  powerSpikes: [],
  laneStrategies: [],
  metaRating: { score: 7, assessment: "Strong", reasoning: "", patchContext: "" },
  generatedAt: "2026-08-18T00:00:00.000Z",
};

/** A synced ranked game, shaped like the select in `loadReadings`. */
function matchRow(csPerMinute: number, i: number) {
  return {
    kills: 3,
    deaths: 2,
    assists: 4,
    csPerMinute,
    visionScore: 20,
    teamId: 100,
    position: "MIDDLE",
    match: {
      id: `match-${i}`,
      gameStart: new Date(`2026-08-0${i + 2}T00:00:00Z`),
      participants: [{ teamId: 100, kills: 3 }],
    },
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listAccounts).mockResolvedValue([{ id: "acc-1", isPrimary: true }] as never);
  vi.mocked(getAccountPuuid).mockResolvedValue("puuid-1");
  vi.mocked(prisma.academyAssignment.findFirst).mockResolvedValue(null as never);
  vi.mocked(prisma.academyAssignment.create).mockImplementation((async ({
    data,
  }: {
    data: Record<string, unknown>;
  }) => ({
    id: "asg-1",
    gamesObserved: 0,
    status: "active",
    evidence: null,
    startedAt: new Date(),
    resolvedAt: null,
    ...data,
  })) as never);
  vi.mocked(getRecommendedOtps).mockResolvedValue([
    { championId: 45, name: "Veigar", position: "MIDDLE", games: 43, winRate: 63, avgKda: 3 },
  ] as never);
  vi.mocked(getCachedOtpAnalysis).mockResolvedValue(ANALYSIS as never);
  // The account itself reads as a support main: the last twenty ranked games were mostly
  // support. This is the state that produced the bug.
  vi.mocked(prisma.matchParticipant.findMany).mockImplementation((async (args: {
    select?: Record<string, unknown>;
  }) => {
    // `primaryPosition` selects only the position; everything else is a readings query.
    if (args.select && Object.keys(args.select).length === 1) {
      return Array.from({ length: 20 }, (_, i) => ({ position: i < 11 ? "UTILITY" : "MIDDLE" }));
    }
    return [7.9, 8.1, 8.3].map(matchRow);
  }) as never);
});

describe("a champion lesson's assignment", () => {
  it("is measured on that champion's games", async () => {
    await openAssignment(USER, VEIGAR);

    expect(prisma.matchParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ championId: 45 }) })
    );
    expect(prisma.academyAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ lessonId: VEIGAR, championId: 45 }),
    });
  });

  /**
   * Found against real data. An account whose last twenty ranked games were eleven support and
   * seven mid reads as a support main — so a Veigar lesson measured in the *account's* main role
   * found zero of its forty-three mid games and opened no assignment at all.
   */
  it("is measured in the role that champion is played in, not the account's main role", async () => {
    await openAssignment(USER, VEIGAR);

    expect(prisma.matchParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ position: "MIDDLE" }) })
    );
    expect(prisma.academyAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ position: "MIDDLE" }),
    });
  });

  it("does not exist when the analysis it was generated from has expired", async () => {
    vi.mocked(getCachedOtpAnalysis).mockResolvedValue(null as never);

    expect(await openAssignment(USER, VEIGAR)).toBeNull();
    expect(prisma.academyAssignment.create).not.toHaveBeenCalled();
  });

  // The negative control: the authored curriculum is champion-blind and still reads the
  // account's own main role, which here is support.
  it("leaves an authored lesson champion-blind and reading the account's main role", async () => {
    await openAssignment(USER, CORE);

    const readings = vi
      .mocked(prisma.matchParticipant.findMany)
      .mock.calls.map(([args]) => (args as { where: Record<string, unknown> }).where)
      .filter((where) => "position" in where);

    expect(readings.every((where) => where.championId === undefined)).toBe(true);
    expect(prisma.academyAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ lessonId: CORE, championId: null, position: "UTILITY" }),
    });
  });
});
