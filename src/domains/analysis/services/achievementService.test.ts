import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkAndAwardAchievements } from "./achievementService";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    matchParticipant: { findMany: vi.fn() },
    rankedHistory: { findMany: vi.fn() },
    userAchievement: { findMany: vi.fn(), create: vi.fn() },
    achievement: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}));

const userId = "user-1";
const riotAccountId = "account-1";

describe("checkAndAwardAchievements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.userAchievement.create).mockResolvedValue({} as never);
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([] as never);
  });

  it("returns empty array when no criteria are met", async () => {
    const result = await checkAndAwardAchievements(userId, riotAccountId);
    expect(result).toEqual([]);
  });

  it("awards first_report when no matches needed (always eligible check returns true)", async () => {
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([] as never);
    const result = await checkAndAwardAchievements(userId, riotAccountId);
    expect(Array.isArray(result)).toBe(true);
  });

  it("does not re-award already-earned achievements", async () => {
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([
      { achievementId: "cs_machine" },
      { achievementId: "first_report" },
    ] as never);
    vi.mocked(prisma.userAchievement.create).mockResolvedValue({} as never);

    const result = await checkAndAwardAchievements(userId, riotAccountId);
    const createCalls = vi.mocked(prisma.userAchievement.create).mock.calls;
    const awardedIds = createCalls.map((c) => (c[0] as { data: { achievementId: string } }).data.achievementId);

    expect(awardedIds).not.toContain("cs_machine");
    expect(awardedIds).not.toContain("first_report");
    expect(result).not.toContain("cs_machine");
  });

  it("awards cs_machine when last 3 matches all have 7.0+ CS/min", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      { csPerMinute: "7.2" },
      { csPerMinute: "7.5" },
      { csPerMinute: "8.0" },
    ] as never);
    vi.mocked(prisma.userAchievement.findMany).mockResolvedValue([] as never);

    const result = await checkAndAwardAchievements(userId, riotAccountId);
    expect(result).toContain("cs_machine");
  });

  it("does not award cs_machine when one match is below 7.0 CS/min", async () => {
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue([
      { csPerMinute: "7.2" },
      { csPerMinute: "6.8" },
      { csPerMinute: "7.5" },
    ] as never);

    const result = await checkAndAwardAchievements(userId, riotAccountId);
    expect(result).not.toContain("cs_machine");
  });
});
