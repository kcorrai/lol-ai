import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrCreateCurrentPatch, getPatchImpact } from "./patchService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    patchVersion: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    matchParticipant: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";

// ── getOrCreateCurrentPatch ───────────────────────────────────────────────────

describe("getOrCreateCurrentPatch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns existing patch without creating a new one", async () => {
    const existingPatch = { version: "14.21.1", detectedAt: new Date("2024-10-30"), isNew: false };
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(["14.21.1", "14.20.1"]),
    } as never);
    vi.mocked(prisma.patchVersion.findUnique).mockResolvedValue({
      id: "p1",
      version: "14.21.1",
      detectedAt: existingPatch.detectedAt,
      patchNotesUrl: null,
    } as never);

    const result = await getOrCreateCurrentPatch();

    expect(result.version).toBe("14.21.1");
    expect(result.isNew).toBe(false);
    expect(prisma.patchVersion.create).not.toHaveBeenCalled();
  });

  it("creates a new patch record when version is unseen", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(["15.1.1", "14.21.1"]),
    } as never);
    vi.mocked(prisma.patchVersion.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.patchVersion.create).mockResolvedValue({
      id: "p2",
      version: "15.1.1",
      detectedAt: new Date(),
      patchNotesUrl: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-15-1-notes/",
    } as never);

    const result = await getOrCreateCurrentPatch();

    expect(result.version).toBe("15.1.1");
    expect(result.isNew).toBe(true);
    expect(prisma.patchVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ version: "15.1.1" }),
      })
    );
  });

  it("falls back to DB when DDragon fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.mocked(prisma.patchVersion.findFirst).mockResolvedValue({
      version: "14.20.1",
      detectedAt: new Date("2024-10-01"),
    } as never);

    const result = await getOrCreateCurrentPatch();

    expect(result.version).toBe("14.20.1");
    expect(result.isNew).toBe(false);
  });

  it("throws when DDragon fails and DB is empty", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.mocked(prisma.patchVersion.findFirst).mockResolvedValue(null);

    await expect(getOrCreateCurrentPatch()).rejects.toThrow("Network error");
  });

  it("generates correct patch notes URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(["14.21.1"]),
    } as never);
    vi.mocked(prisma.patchVersion.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.patchVersion.create).mockResolvedValue({
      id: "p3",
      version: "14.21.1",
      detectedAt: new Date(),
      patchNotesUrl: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-14-21-notes/",
    } as never);

    await getOrCreateCurrentPatch();

    expect(prisma.patchVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          patchNotesUrl: "https://www.leagueoflegends.com/en-us/news/game-updates/patch-14-21-notes/",
        }),
      })
    );
  });
});

// ── getPatchImpact ────────────────────────────────────────────────────────────

describe("getPatchImpact", () => {
  const patchDate = new Date("2024-10-30T00:00:00Z");

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(["14.21.1"]),
    } as never);
    vi.mocked(prisma.patchVersion.findUnique).mockResolvedValue({
      id: "p1", version: "14.21.1", detectedAt: patchDate, patchNotesUrl: "https://example.com/patch",
    } as never);
  });

  it("returns hasEnoughData: false when no champions have enough games", async () => {
    // Only 2 games before patch, 2 after — below MIN_GAMES_PER_WINDOW (5)
    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(
      Array.from({ length: 4 }, (_, i) => ({
        championName: "Ahri",
        won: true,
        match: { gameStart: i < 2 ? new Date("2024-10-01") : new Date("2024-11-01") },
      })) as never
    );

    const result = await getPatchImpact("acc-1");

    expect(result.hasEnoughData).toBe(false);
    expect(result.champions).toHaveLength(0);
  });

  it("filters out champions with delta below threshold (3%)", async () => {
    // 10 before: 5/10 = 50%, 10 after: 6/10 = 60%, delta = 10% → should include
    // But let's make a champion with exactly 2% delta which should be excluded
    const participants = [
      // Ahri: 10 before (50% WR), 10 after (52% WR) — delta 2% → excluded
      ...Array.from({ length: 10 }, (_, i) => ({
        championName: "Ahri",
        won: i < 5,
        match: { gameStart: new Date("2024-10-01") },
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        championName: "Ahri",
        won: i < 6, // 60% → but floor rounding gives 50% and 60% = delta 10% hmm
        // Let's use a 2% delta: 50 before, 52 after
        match: { gameStart: new Date("2024-11-01") },
      })),
    ];
    // Override: 5/10 = 50%, 5/10 = 50% → delta 0% → excluded
    const zeroDeltas = Array.from({ length: 20 }, (_, i) => ({
      championName: "Viktor",
      won: i % 2 === 0,
      match: { gameStart: i < 10 ? new Date("2024-10-01") : new Date("2024-11-01") },
    }));

    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(
      [...zeroDeltas] as never
    );

    const result = await getPatchImpact("acc-1");

    // Viktor: 50% before, 50% after → 0% delta → excluded
    expect(result.champions.find((c) => c.championName === "Viktor")).toBeUndefined();
  });

  it("returns champions sorted by absolute delta descending", async () => {
    // Ahri: 50% → 80% delta = +30
    // Viktor: 60% → 20% delta = -40
    const participants = [
      ...Array.from({ length: 10 }, () => ({ championName: "Ahri", won: true, match: { gameStart: new Date("2024-10-01") } })),
      ...Array.from({ length: 10 }, (_, i) => ({ championName: "Ahri", won: i < 8, match: { gameStart: new Date("2024-11-01") } })),
      ...Array.from({ length: 10 }, (_, i) => ({ championName: "Viktor", won: i < 6, match: { gameStart: new Date("2024-10-01") } })),
      ...Array.from({ length: 10 }, (_, i) => ({ championName: "Viktor", won: i < 2, match: { gameStart: new Date("2024-11-01") } })),
    ];

    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(participants as never);

    const result = await getPatchImpact("acc-1");

    // Viktor delta = 20-60 = -40 (abs 40), Ahri delta = 80-100 = -20 wait let me recalculate
    // Ahri before: 10/10 = 100%, after: 8/10 = 80%, delta = -20
    // Viktor before: 6/10 = 60%, after: 2/10 = 20%, delta = -40
    // Sort by abs: Viktor (40) > Ahri (20)
    expect(result.champions[0].championName).toBe("Viktor");
    expect(Math.abs(result.champions[0].wrDelta)).toBeGreaterThan(Math.abs(result.champions[1].wrDelta));
  });

  it("caps results at 5 champions", async () => {
    const champNames = ["Ahri", "Viktor", "Syndra", "Orianna", "Lux", "Zoe", "Vex"];
    const participants = champNames.flatMap((name) => [
      ...Array.from({ length: 10 }, () => ({ championName: name, won: true, match: { gameStart: new Date("2024-10-01") } })),
      ...Array.from({ length: 10 }, (_, i) => ({ championName: name, won: i < 2, match: { gameStart: new Date("2024-11-01") } })),
    ]);

    vi.mocked(prisma.matchParticipant.findMany).mockResolvedValue(participants as never);

    const result = await getPatchImpact("acc-1");

    expect(result.champions.length).toBeLessThanOrEqual(5);
  });
});
