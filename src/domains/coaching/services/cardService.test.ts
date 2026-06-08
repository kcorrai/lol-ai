import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCardByToken } from "./cardService";
import { prisma } from "@/lib/db/prisma";
import { toJsonInput } from "@/types/json";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    shareableCard: { findUnique: vi.fn(), update: vi.fn() },
    riotAccount: { findUnique: vi.fn() },
    matchParticipant: { findMany: vi.fn() },
    rankedHistory: { findMany: vi.fn() },
    coachingReport: { findFirst: vi.fn() },
    champion: { findFirst: vi.fn() },
    championStat: { findUnique: vi.fn() },
  },
}));

vi.mock("@/types/json", () => ({
  toJsonInput: vi.fn((v) => v),
  fromJsonValue: vi.fn((v) => v),
}));

const mockWeeklyCard = {
  cardType: "weekly" as const,
  gameName: "TestPlayer",
  tagLine: "EUW",
  lpDelta: 50,
  winRate: 60,
  gamesPlayed: 10,
  bestChampionName: "Jinx",
  bestChampionWinRate: 70,
  masteryScore: null,
  coachGrade: "A",
  isPro: false,
};

describe("getCardByToken", () => {
  beforeEach(() => {
    vi.mocked(prisma.shareableCard.update).mockResolvedValue({} as never);
  });

  it("returns card data and expired=false when card is active", async () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    vi.mocked(prisma.shareableCard.findUnique).mockResolvedValue({
      id: "card-1",
      token: "tok-abc",
      data: toJsonInput(mockWeeklyCard),
      expiresAt,
      viewCount: 0,
    } as never);

    const result = await getCardByToken("tok-abc");
    expect(result.expired).toBe(false);
    expect(result.data).toMatchObject({ cardType: "weekly", gameName: "TestPlayer" });
  });

  it("returns expired=true when card is past expiresAt", async () => {
    const expiresAt = new Date(Date.now() - 1000);
    vi.mocked(prisma.shareableCard.findUnique).mockResolvedValue({
      id: "card-1",
      token: "tok-old",
      data: toJsonInput(mockWeeklyCard),
      expiresAt,
      viewCount: 3,
    } as never);

    const result = await getCardByToken("tok-old");
    expect(result.expired).toBe(true);
  });

  it("throws NOT_FOUND when token does not exist", async () => {
    vi.mocked(prisma.shareableCard.findUnique).mockResolvedValue(null);
    await expect(getCardByToken("bad-token")).rejects.toThrow("NOT_FOUND");
  });

  it("increments view count only for non-expired cards", async () => {
    const expiresAt = new Date(Date.now() + 86400_000);
    vi.mocked(prisma.shareableCard.findUnique).mockResolvedValue({
      id: "card-2",
      token: "tok-fresh",
      data: toJsonInput(mockWeeklyCard),
      expiresAt,
      viewCount: 0,
    } as never);

    await getCardByToken("tok-fresh");
    expect(prisma.shareableCard.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "card-2" } })
    );
  });

  it("does not increment view count for expired cards", async () => {
    vi.mocked(prisma.shareableCard.update).mockClear();
    const expiresAt = new Date(Date.now() - 1000);
    vi.mocked(prisma.shareableCard.findUnique).mockResolvedValue({
      id: "card-3",
      token: "tok-exp",
      data: toJsonInput(mockWeeklyCard),
      expiresAt,
      viewCount: 5,
    } as never);

    await getCardByToken("tok-exp");
    expect(prisma.shareableCard.update).not.toHaveBeenCalled();
  });
});
