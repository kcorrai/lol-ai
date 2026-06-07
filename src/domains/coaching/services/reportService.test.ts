import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coachingReport: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { generateShareToken, getPublicReport, getReportStatus } from "./reportService";

const mockPrisma = prisma as unknown as {
  coachingReport: {
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── generateShareToken ────────────────────────────────────────────────────────

describe("generateShareToken", () => {
  it("returns existing token without writing if one already exists", async () => {
    mockPrisma.coachingReport.findFirst.mockResolvedValue({
      id: "report-1",
      shareToken: "existingtoken1234",
    });

    const token = await generateShareToken("report-1", "user-1");

    expect(token).toBe("existingtoken1234");
    expect(mockPrisma.coachingReport.updateMany).not.toHaveBeenCalled();
  });

  it("generates a new token when none exists", async () => {
    mockPrisma.coachingReport.findFirst.mockResolvedValue({ id: "report-1", shareToken: null });
    mockPrisma.coachingReport.updateMany.mockResolvedValue({ count: 1 });

    const token = await generateShareToken("report-1", "user-1");

    expect(token).toHaveLength(32); // randomBytes(16).toString("hex") = 32 chars
    expect(mockPrisma.coachingReport.updateMany).toHaveBeenCalledWith({
      where: { id: "report-1", shareToken: null },
      data: { shareToken: token },
    });
  });

  it("handles race condition: if updateMany matches 0 rows, returns the winning token", async () => {
    mockPrisma.coachingReport.findFirst.mockResolvedValue({ id: "report-1", shareToken: null });
    mockPrisma.coachingReport.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.coachingReport.findUnique.mockResolvedValue({ shareToken: "winner-token-set-by-concurrent-request" });

    const token = await generateShareToken("report-1", "user-1");

    expect(token).toBe("winner-token-set-by-concurrent-request");
  });

  it("throws 404 when report does not belong to the user", async () => {
    mockPrisma.coachingReport.findFirst.mockResolvedValue(null);

    await expect(generateShareToken("report-999", "user-1")).rejects.toMatchObject({
      code: "RESOURCE_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("throws 404 when report exists but is not complete", async () => {
    // findFirst with status:"complete" filter returns null for pending/failed reports
    mockPrisma.coachingReport.findFirst.mockResolvedValue(null);

    await expect(generateShareToken("report-pending", "user-1")).rejects.toMatchObject({
      code: "RESOURCE_NOT_FOUND",
    });
  });
});

// ── getReportStatus ───────────────────────────────────────────────────────────

describe("getReportStatus", () => {
  it("rapor pending durumundayken status döndürüyor", async () => {
    mockPrisma.coachingReport.findFirst.mockResolvedValue({ id: "report-1", status: "pending" });

    const result = await getReportStatus("report-1", "user-1");

    expect(result.status).toBe("pending");
  });

  it("rapor complete durumundayken status döndürüyor", async () => {
    mockPrisma.coachingReport.findFirst.mockResolvedValue({ id: "report-1", status: "complete" });

    const result = await getReportStatus("report-1", "user-1");

    expect(result.status).toBe("complete");
  });

  it("rapor bulunamadığında 404 fırlatıyor", async () => {
    mockPrisma.coachingReport.findFirst.mockResolvedValue(null);

    await expect(getReportStatus("report-999", "user-1")).rejects.toMatchObject({
      code: "RESOURCE_NOT_FOUND",
      statusCode: 404,
    });
  });
});

// ── getPublicReport ───────────────────────────────────────────────────────────

describe("getPublicReport", () => {
  const baseReport = {
    id: "report-1",
    reportType: "session_review" as const,
    summary: "Great performance this session.",
    coachPersonaResponse: "Keep focusing on CS!",
    actionItems: [{ action: "Improve CS", expectedImpact: "+2 CS/min" }],
    championRecommendations: [
      { championName: "Yasuo", priority: "high" },
      { championName: "Zed", priority: "medium" },
    ],
    completedAt: new Date("2026-06-01"),
    shareToken: "validtoken1234",
    riotAccount: {
      gameName: "Kaanproak",
      tagLine: "TR1",
      region: "tr1",
      rankedHistory: [{ tier: "GOLD", division: "II" }],
    },
  };

  it("returns public report with correct shape", async () => {
    mockPrisma.coachingReport.findUnique.mockResolvedValue(baseReport);

    const result = await getPublicReport("validtoken1234");

    expect(result.gameName).toBe("Kaanproak");
    expect(result.tagLine).toBe("TR1");
    expect(result.region).toBe("tr1");
    expect(result.rankDisplay).toBe("Gold II");
    expect(result.topChampionName).toBe("Yasuo");
    expect(result.firstActionItem).toEqual({ action: "Improve CS", expectedImpact: "+2 CS/min" });
  });

  it("does not include shareToken in the returned object", async () => {
    mockPrisma.coachingReport.findUnique.mockResolvedValue(baseReport);

    const result = await getPublicReport("validtoken1234");

    expect(result).not.toHaveProperty("shareToken");
  });

  it("returns null rankDisplay when no ranked history exists", async () => {
    mockPrisma.coachingReport.findUnique.mockResolvedValue({
      ...baseReport,
      riotAccount: { ...baseReport.riotAccount, rankedHistory: [] },
    });

    const result = await getPublicReport("validtoken1234");

    expect(result.rankDisplay).toBeNull();
  });

  it("returns null topChampionName when no champion recommendations exist", async () => {
    mockPrisma.coachingReport.findUnique.mockResolvedValue({
      ...baseReport,
      championRecommendations: null,
    });

    const result = await getPublicReport("validtoken1234");

    expect(result.topChampionName).toBeNull();
  });

  it("throws 404 for invalid (too short) token without hitting the database", async () => {
    await expect(getPublicReport("short")).rejects.toMatchObject({
      code: "RESOURCE_NOT_FOUND",
    });

    expect(mockPrisma.coachingReport.findUnique).not.toHaveBeenCalled();
  });

  it("throws 404 when no report matches the token", async () => {
    mockPrisma.coachingReport.findUnique.mockResolvedValue(null);

    await expect(getPublicReport("validbutunknown1234")).rejects.toMatchObject({
      code: "RESOURCE_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("throws 404 when report exists but shareToken is null (share revoked)", async () => {
    mockPrisma.coachingReport.findUnique.mockResolvedValue({
      ...baseReport,
      shareToken: null,
    });

    await expect(getPublicReport("validtoken1234")).rejects.toMatchObject({
      code: "RESOURCE_NOT_FOUND",
    });
  });

  it("capitalizes rank tier correctly for all cases", async () => {
    const tiers = [
      ["IRON", "I", "Iron I"],
      ["BRONZE", "II", "Bronze II"],
      ["SILVER", "III", "Silver III"],
      ["GOLD", "IV", "Gold IV"],
      ["PLATINUM", "I", "Platinum I"],
      ["EMERALD", "II", "Emerald II"],
      ["DIAMOND", "III", "Diamond III"],
    ] as const;

    for (const [tier, division, expected] of tiers) {
      mockPrisma.coachingReport.findUnique.mockResolvedValue({
        ...baseReport,
        riotAccount: {
          ...baseReport.riotAccount,
          rankedHistory: [{ tier, division }],
        },
      });

      const result = await getPublicReport("validtoken1234");
      expect(result.rankDisplay).toBe(expected);
    }
  });
});
