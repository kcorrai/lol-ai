import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectAndPersistHabits, getActiveHabits } from "./habitDetectionService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    performanceSnapshot: { findMany: vi.fn() },
    playerHabit: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";

const makeSnapshot = (overrides: {
  id?: string;
  periodEnd?: Date;
  weakestArea?: string | null;
  tiltScore?: number;
  gamesAnalyzed?: number;
}) => ({
  id: overrides.id ?? "snap-1",
  periodEnd: overrides.periodEnd ?? new Date(),
  weakestArea: overrides.weakestArea ?? null,
  tiltScore: overrides.tiltScore ?? 0,
  gamesAnalyzed: overrides.gamesAnalyzed ?? 10,
});

// ── detectAndPersistHabits ────────────────────────────────────────────────────

describe("detectAndPersistHabits", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns early without creating habits when fewer than 2 snapshots", async () => {
    vi.mocked(prisma.performanceSnapshot.findMany).mockResolvedValue([makeSnapshot({}) as never]);

    await detectAndPersistHabits("acc-1");

    expect(prisma.playerHabit.create).not.toHaveBeenCalled();
    expect(prisma.playerHabit.update).not.toHaveBeenCalled();
  });

  it("creates a new habit when recurring weakestArea is detected (2+ weeks)", async () => {
    vi.mocked(prisma.performanceSnapshot.findMany).mockResolvedValue([
      makeSnapshot({ id: "s1", weakestArea: "cs_farming" }),
      makeSnapshot({ id: "s2", weakestArea: "cs_farming" }),
    ] as never);
    vi.mocked(prisma.playerHabit.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.playerHabit.findMany).mockResolvedValue([]);
    vi.mocked(prisma.playerHabit.create).mockResolvedValue({} as never);

    await detectAndPersistHabits("acc-1");

    expect(prisma.playerHabit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ habitType: "low_cs", riotAccountId: "acc-1" }),
      })
    );
  });

  it("does not create a habit when weakestArea appears only once", async () => {
    vi.mocked(prisma.performanceSnapshot.findMany).mockResolvedValue([
      makeSnapshot({ id: "s1", weakestArea: "cs_farming" }),
      makeSnapshot({ id: "s2", weakestArea: "vision_control" }),
    ] as never);
    vi.mocked(prisma.playerHabit.findMany).mockResolvedValue([]);

    await detectAndPersistHabits("acc-1");

    expect(prisma.playerHabit.create).not.toHaveBeenCalled();
  });

  it("updates existing unresolved habit instead of creating a duplicate", async () => {
    vi.mocked(prisma.performanceSnapshot.findMany).mockResolvedValue([
      makeSnapshot({ id: "s1", weakestArea: "death_reduction" }),
      makeSnapshot({ id: "s2", weakestArea: "death_reduction" }),
      makeSnapshot({ id: "s3", weakestArea: "death_reduction" }),
    ] as never);
    const existingHabit = { id: "habit-1", habitType: "high_deaths" };
    vi.mocked(prisma.playerHabit.findFirst).mockResolvedValue(existingHabit as never);
    vi.mocked(prisma.playerHabit.update).mockResolvedValue({} as never);
    vi.mocked(prisma.playerHabit.findMany).mockResolvedValue([existingHabit] as never);

    await detectAndPersistHabits("acc-1");

    expect(prisma.playerHabit.update).toHaveBeenCalled();
    expect(prisma.playerHabit.create).not.toHaveBeenCalled();
  });

  it("detects tilt_prone when average tilt score > 60 across 2+ snapshots", async () => {
    vi.mocked(prisma.performanceSnapshot.findMany).mockResolvedValue([
      makeSnapshot({ id: "s1", tiltScore: 70 }),
      makeSnapshot({ id: "s2", tiltScore: 80 }),
    ] as never);
    vi.mocked(prisma.playerHabit.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.playerHabit.findMany).mockResolvedValue([]);
    vi.mocked(prisma.playerHabit.create).mockResolvedValue({} as never);

    await detectAndPersistHabits("acc-1");

    expect(prisma.playerHabit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ habitType: "tilt_prone" }),
      })
    );
  });

  it("does not flag tilt_prone when average score <= 60", async () => {
    vi.mocked(prisma.performanceSnapshot.findMany).mockResolvedValue([
      makeSnapshot({ id: "s1", tiltScore: 40 }),
      makeSnapshot({ id: "s2", tiltScore: 50 }),
    ] as never);
    vi.mocked(prisma.playerHabit.findMany).mockResolvedValue([]);

    await detectAndPersistHabits("acc-1");

    const createCalls = vi.mocked(prisma.playerHabit.create).mock.calls;
    const tiltCall = createCalls.find(
      (call) => (call[0] as { data: { habitType: string } }).data.habitType === "tilt_prone"
    );
    expect(tiltCall).toBeUndefined();
  });

  it("resolves stale habits no longer in candidate list", async () => {
    vi.mocked(prisma.performanceSnapshot.findMany).mockResolvedValue([
      makeSnapshot({ id: "s1", weakestArea: "cs_farming" }),
      makeSnapshot({ id: "s2", weakestArea: "cs_farming" }),
    ] as never);
    vi.mocked(prisma.playerHabit.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.playerHabit.create).mockResolvedValue({} as never);
    // vision_control was active but is no longer in candidates
    vi.mocked(prisma.playerHabit.findMany).mockResolvedValue([
      { id: "stale-1", habitType: "low_vision" },
    ] as never);
    vi.mocked(prisma.playerHabit.updateMany).mockResolvedValue({ count: 1 } as never);

    await detectAndPersistHabits("acc-1");

    expect(prisma.playerHabit.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isResolved: true }),
      })
    );
  });

  it("assigns severity 'high' when weekCount >= 3", async () => {
    vi.mocked(prisma.performanceSnapshot.findMany).mockResolvedValue([
      makeSnapshot({ id: "s1", weakestArea: "vision_control" }),
      makeSnapshot({ id: "s2", weakestArea: "vision_control" }),
      makeSnapshot({ id: "s3", weakestArea: "vision_control" }),
    ] as never);
    vi.mocked(prisma.playerHabit.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.playerHabit.create).mockResolvedValue({} as never);
    vi.mocked(prisma.playerHabit.findMany).mockResolvedValue([]);

    await detectAndPersistHabits("acc-1");

    expect(prisma.playerHabit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ severity: "high", weekCount: 3 }),
      })
    );
  });
});

// ── getActiveHabits ───────────────────────────────────────────────────────────

describe("getActiveHabits", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no active habits", async () => {
    vi.mocked(prisma.playerHabit.findMany).mockResolvedValue([]);

    const result = await getActiveHabits("acc-1");

    expect(result).toEqual([]);
  });

  it("maps DB rows to DetectedHabit DTOs with correct displayName", async () => {
    vi.mocked(prisma.playerHabit.findMany).mockResolvedValue([
      {
        id: "h-1",
        habitType: "low_cs",
        severity: "high",
        weekCount: 3,
        firstDetected: new Date("2024-01-01"),
        lastDetected: new Date("2024-01-22"),
        isResolved: false,
        evidence: [],
      },
    ] as never);

    const result = await getActiveHabits("acc-1");

    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe("Low CS Per Minute");
    expect(result[0].habitType).toBe("low_cs");
    expect(result[0].message).toContain("3 weeks");
    expect(result[0].isResolved).toBe(false);
  });

  it("only returns unresolved habits", async () => {
    vi.mocked(prisma.playerHabit.findMany).mockResolvedValue([]);

    await getActiveHabits("acc-1");

    expect(prisma.playerHabit.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isResolved: false }),
      })
    );
  });
});
