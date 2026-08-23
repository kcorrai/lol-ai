import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeWeeklyScore, generatePlan, getActivePlan } from "./improvementPlanService";
import { prisma } from "@/lib/db/prisma";
import type { PlanProgress } from "@/domains/analysis/types/analysis.types";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    improvementPlan: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("./matchAnalysisService", () => ({
  getPlayerPerformanceProfile: vi.fn(),
}));

import { getPlayerPerformanceProfile } from "./matchAnalysisService";

function mockProfile(
  overrides: Partial<{
    winRate: number;
    avgDeaths: number;
    csPerMinute: number;
    kda: number;
  }> = {}
) {
  return {
    riotAccountId: "acc-1",
    gamesAnalyzed: 20,
    winRate: overrides.winRate ?? 45,
    avgMetrics: {
      avgDeathsPerGame: overrides.avgDeaths ?? 4.5,
      csPerMinute: overrides.csPerMinute ?? 5.5,
      kda: overrides.kda ?? 2.5,
      avgKillsPerGame: 5,
      avgAssistsPerGame: 6,
      avgGoldPerMinute: 300,
      avgDamageShare: 0.25,
      avgVisionScore: 20,
    },
    playstyle: "carry" as const,
    strongestArea: "Kills",
    weakestArea: "Deaths",
    recentMatches: [
      {
        matchDbId: "m1",
        won: true,
        kills: 5,
        deaths: 2,
        assists: 8,
        csPerMinute: 5.5,
        visionScore: 18,
        champion: "Jinx",
        gameDurationMinutes: 30,
        goldPerMinute: 300,
        damageShare: 0.25,
        position: "BOT",
        riotMatchId: "r1",
        notableEvents: [],
        itemIds: [],
        gameStart: new Date().toISOString(),
        summonerSpell1: 4,
        summonerSpell2: 7,
        runePrimaryKeystone: null,
      },
      {
        matchDbId: "m2",
        won: false,
        kills: 2,
        deaths: 7,
        assists: 3,
        csPerMinute: 4.5,
        visionScore: 15,
        champion: "Caitlyn",
        gameDurationMinutes: 25,
        goldPerMinute: 270,
        damageShare: 0.2,
        position: "BOT",
        riotMatchId: "r2",
        notableEvents: [],
        itemIds: [],
        gameStart: new Date().toISOString(),
        summonerSpell1: 4,
        summonerSpell2: 7,
        runePrimaryKeystone: null,
      },
    ],
    mostPlayedChampions: ["Jinx", "Caitlyn"],
    deathCluster: "late_game" as const,
    csConsistency: "inconsistent" as const,
    visionConsistency: "inconsistent" as const,
    winRate7d: 45,
    longestWinStreak: 2,
    longestLossStreak: 3,
  };
}

describe("computeWeeklyScore", () => {
  it("returns 0 for empty targets", () => {
    expect(computeWeeklyScore([])).toBe(0);
  });

  it("returns 33 for one achieved target out of one", () => {
    const targets: PlanProgress[] = [
      {
        metric: "winRate",
        label: "Win Rate",
        baseline: 45,
        goal: 55,
        unit: "%",
        direction: "increase",
        current: 55,
        progress: 1,
        achieved: true,
      },
    ];
    expect(computeWeeklyScore(targets)).toBe(33);
  });

  it("returns 99 for 3 achieved targets", () => {
    const achieved = (metric: string): PlanProgress => ({
      metric: metric as PlanProgress["metric"],
      label: metric,
      baseline: 0,
      goal: 10,
      unit: "",
      direction: "increase",
      current: 10,
      progress: 1,
      achieved: true,
    });
    expect(computeWeeklyScore([achieved("winRate"), achieved("kda"), achieved("deaths")])).toBe(99);
  });

  it("gives partial score for progress > 0.5 but not achieved", () => {
    const partial: PlanProgress = {
      metric: "winRate",
      label: "Win Rate",
      baseline: 45,
      goal: 55,
      unit: "%",
      direction: "increase",
      current: 51,
      progress: 0.6,
      achieved: false,
    };
    expect(computeWeeklyScore([partial])).toBe(15);
  });

  it("caps at 100", () => {
    const targets = Array.from(
      { length: 10 },
      (): PlanProgress => ({
        metric: "winRate",
        label: "Win Rate",
        baseline: 0,
        goal: 1,
        unit: "",
        direction: "increase",
        current: 1,
        progress: 1,
        achieved: true,
      })
    );
    expect(computeWeeklyScore(targets)).toBe(100);
  });
});

describe("generatePlan", () => {
  beforeEach(() => {
    vi.mocked(prisma.improvementPlan.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.improvementPlan.create).mockImplementation(
      ({ data }) =>
        Promise.resolve({
          id: "plan-new",
          riotAccountId: data.riotAccountId as string,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: "active",
          targets: data.targets,
        }) as never
    );
  });

  it("expires existing active plans before creating a new one", async () => {
    vi.mocked(getPlayerPerformanceProfile).mockResolvedValue(mockProfile() as never);
    await generatePlan("acc-1");
    expect(prisma.improvementPlan.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "active" }) })
    );
  });

  it("generates at least one improvement target", async () => {
    vi.mocked(getPlayerPerformanceProfile).mockResolvedValue(
      mockProfile({ winRate: 40, avgDeaths: 5, csPerMinute: 4 }) as never
    );
    const plan = await generatePlan("acc-1");
    expect(plan.targets.length).toBeGreaterThan(0);
  });

  it("generates a target even for a high-performing player", async () => {
    vi.mocked(getPlayerPerformanceProfile).mockResolvedValue(
      mockProfile({ winRate: 70, avgDeaths: 2, csPerMinute: 8, kda: 5 }) as never
    );
    const plan = await generatePlan("acc-1");
    expect(plan.targets.length).toBeGreaterThanOrEqual(1);
  });

  it("returns a plan with 14-day expiry", async () => {
    vi.mocked(getPlayerPerformanceProfile).mockResolvedValue(mockProfile() as never);
    const plan = await generatePlan("acc-1");
    const daysUntilExpiry =
      (new Date(plan.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysUntilExpiry).toBeGreaterThan(13);
    expect(daysUntilExpiry).toBeLessThanOrEqual(15);
  });
});

describe("getActivePlan", () => {
  it("returns null when no plan exists for the account", async () => {
    vi.mocked(prisma.improvementPlan.findFirst).mockResolvedValue(null);
    const result = await getActivePlan("acc-no-plan");
    expect(result).toBeNull();
  });
});
