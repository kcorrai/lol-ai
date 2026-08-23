import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActiveChallengeStreak, getUserXpLevel } from "./challengeProgressService";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    userChallenge: { findMany: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    challenge: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    matchParticipant: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/utils/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
vi.mock("@/lib/ai/client", () => ({ getAiClient: vi.fn() }));
vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn().mockResolvedValue(null),
  setCached: vi.fn(),
  buildCacheKey: vi.fn().mockReturnValue("test-key"),
}));

const userId = "user-1";

describe("getActiveChallengeStreak", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 0 when no challenges completed in the last 7 days", async () => {
    vi.mocked(prisma.userChallenge.findMany).mockResolvedValue([] as never);
    const streak = await getActiveChallengeStreak(userId);
    expect(streak).toBe(0);
  });

  it("returns 1 when only today has a completion", async () => {
    const today = new Date();
    vi.mocked(prisma.userChallenge.findMany).mockResolvedValue([{ completedAt: today }] as never);
    const streak = await getActiveChallengeStreak(userId);
    expect(streak).toBe(1);
  });

  it("returns streak length for consecutive days", async () => {
    const days = [0, 1, 2].map((n) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - n);
      return { completedAt: d };
    });
    vi.mocked(prisma.userChallenge.findMany).mockResolvedValue(days as never);
    const streak = await getActiveChallengeStreak(userId);
    expect(streak).toBe(3);
  });

  it("breaks streak on a missed day", async () => {
    const days = [0, 2].map((n) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - n);
      return { completedAt: d };
    });
    vi.mocked(prisma.userChallenge.findMany).mockResolvedValue(days as never);
    const streak = await getActiveChallengeStreak(userId);
    expect(streak).toBe(1);
  });
});

describe("getUserXpLevel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns level 1 and full xpToNext when user has 0 XP", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ xp: 0, level: 1 } as never);
    const result = await getUserXpLevel(userId);
    expect(result).toEqual({ xp: 0, level: 1, xpToNext: 500 });
  });

  it("returns correct xpToNext mid-level", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ xp: 300, level: 1 } as never);
    const result = await getUserXpLevel(userId);
    expect(result.xpToNext).toBe(200);
  });

  it("returns level 2 and correct xpToNext after leveling up", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ xp: 600, level: 2 } as never);
    const result = await getUserXpLevel(userId);
    expect(result.level).toBe(2);
    expect(result.xpToNext).toBe(400);
  });

  it("handles null user gracefully", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
    const result = await getUserXpLevel(userId);
    expect(result).toEqual({ xp: 0, level: 1, xpToNext: 500 });
  });
});
