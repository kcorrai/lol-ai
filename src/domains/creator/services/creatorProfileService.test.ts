import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    creatorProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    riotAccount: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import {
  enableKit,
  getKit,
  resetSession,
  rotateOverlayKey,
  saveSettings,
} from "./creatorProfileService";
import { isOverlayKeyFormat } from "@/domains/creator/overlayKey";
import type { CreatorSettings } from "@/domains/creator/types";

const mockPrisma = prisma as unknown as {
  creatorProfile: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  riotAccount: { findFirst: ReturnType<typeof vi.fn> };
};

function profileRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "creator-1",
    userId: "user-1",
    riotAccountId: null,
    overlayKey: "aaaaaaaaaaaaaaaaaaaaaa",
    enabled: true,
    displayName: null,
    streamSafe: false,
    delaySeconds: 0,
    theme: "dark",
    accentColor: "#22d3ee",
    sessionStartedAt: null,
    goalTier: null,
    goalDivision: null,
    twitchHandle: null,
    kickHandle: null,
    youtubeHandle: null,
    createdAt: new Date("2026-08-18T00:00:00.000Z"),
    updatedAt: new Date("2026-08-18T00:00:00.000Z"),
    ...overrides,
  };
}

const SETTINGS: CreatorSettings = {
  enabled: true,
  riotAccountId: null,
  displayName: "Kaan",
  streamSafe: true,
  delaySeconds: 90,
  theme: "dark",
  accentColor: "#22d3ee",
  goalTier: null,
  goalDivision: null,
  twitchHandle: "kaan",
  kickHandle: null,
  youtubeHandle: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getKit", () => {
  it("returns null when creator mode was never enabled", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(null);
    expect(await getKit("user-1")).toBeNull();
  });

  it("serialises the session start as an ISO string", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(
      profileRow({ sessionStartedAt: new Date("2026-08-18T10:00:00.000Z") })
    );

    const kit = await getKit("user-1");
    expect(kit?.sessionStartedAt).toBe("2026-08-18T10:00:00.000Z");
  });
});

describe("enableKit", () => {
  it("mints a well-formed key on first enable", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(null);
    mockPrisma.creatorProfile.create.mockImplementation(
      ({ data }: { data: { overlayKey: string } }) =>
        Promise.resolve(profileRow({ overlayKey: data.overlayKey }))
    );

    const kit = await enableKit("user-1");
    expect(isOverlayKeyFormat(kit.overlayKey)).toBe(true);
  });

  // A second click must not break the OBS source the first one produced.
  it("returns the existing key rather than minting a new one", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(
      profileRow({ overlayKey: "existingkeyexistingke1" })
    );

    const kit = await enableKit("user-1");

    expect(kit.overlayKey).toBe("existingkeyexistingke1");
    expect(mockPrisma.creatorProfile.create).not.toHaveBeenCalled();
    expect(mockPrisma.creatorProfile.update).not.toHaveBeenCalled();
  });

  it("re-enables a disabled kit without changing its key", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(
      profileRow({ enabled: false, overlayKey: "keptkeykeptkeykeptkey1" })
    );
    mockPrisma.creatorProfile.update.mockResolvedValue(
      profileRow({ enabled: true, overlayKey: "keptkeykeptkeykeptkey1" })
    );

    const kit = await enableKit("user-1");

    expect(kit.enabled).toBe(true);
    expect(kit.overlayKey).toBe("keptkeykeptkeykeptkey1");
    expect(mockPrisma.creatorProfile.update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { enabled: true },
    });
  });
});

describe("saveSettings", () => {
  it("refuses when creator mode is not enabled", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(null);

    const result = await saveSettings("user-1", SETTINGS);

    expect(result.ok).toBe(false);
    expect(mockPrisma.creatorProfile.update).not.toHaveBeenCalled();
  });

  // The check that stops the kit reading a stranger's rank onto a stream.
  it("refuses a Riot account the user does not own", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(profileRow());
    mockPrisma.riotAccount.findFirst.mockResolvedValue(null);

    const result = await saveSettings("user-1", {
      ...SETTINGS,
      riotAccountId: "00000000-0000-0000-0000-000000000001",
    });

    expect(result).toEqual({
      ok: false,
      reason: "That Riot account is not linked to your profile.",
    });
    expect(mockPrisma.creatorProfile.update).not.toHaveBeenCalled();
  });

  it("accepts a Riot account the user owns", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(profileRow());
    mockPrisma.riotAccount.findFirst.mockResolvedValue({ id: "riot-1" });
    mockPrisma.creatorProfile.update.mockResolvedValue(profileRow({ riotAccountId: "riot-1" }));

    const result = await saveSettings("user-1", {
      ...SETTINGS,
      riotAccountId: "00000000-0000-0000-0000-000000000001",
    });

    expect(result.ok).toBe(true);
  });

  it("does not query Riot accounts when none was chosen", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(profileRow());
    mockPrisma.creatorProfile.update.mockResolvedValue(profileRow());

    await saveSettings("user-1", SETTINGS);

    expect(mockPrisma.riotAccount.findFirst).not.toHaveBeenCalled();
  });

  it("refuses a goal tier with no division, which cannot be placed on the ladder", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(profileRow());

    const result = await saveSettings("user-1", { ...SETTINGS, goalTier: "DIAMOND" });

    expect(result).toEqual({
      ok: false,
      reason: "A goal rank needs both a tier and a division.",
    });
  });

  it("refuses a goal division with no tier", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(profileRow());

    const result = await saveSettings("user-1", { ...SETTINGS, goalDivision: "II" });

    expect(result.ok).toBe(false);
  });

  it("accepts both halves of a goal together", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(profileRow());
    mockPrisma.creatorProfile.update.mockResolvedValue(
      profileRow({ goalTier: "DIAMOND", goalDivision: "IV" })
    );

    const result = await saveSettings("user-1", {
      ...SETTINGS,
      goalTier: "DIAMOND",
      goalDivision: "IV",
    });

    expect(result.ok).toBe(true);
  });

  it("clamps a delay the caller sent past the ceiling", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(profileRow());
    mockPrisma.creatorProfile.update.mockResolvedValue(profileRow());

    await saveSettings("user-1", { ...SETTINGS, delaySeconds: 99_999 });

    const call = mockPrisma.creatorProfile.update.mock.calls[0]?.[0] as {
      data: { delaySeconds: number };
    };
    expect(call.data.delaySeconds).toBe(900);
  });

  // The key must not be writable through the settings path.
  it("never writes the overlay key", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(profileRow());
    mockPrisma.creatorProfile.update.mockResolvedValue(profileRow());

    await saveSettings("user-1", SETTINGS);

    const call = mockPrisma.creatorProfile.update.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(call.data).not.toHaveProperty("overlayKey");
  });
});

describe("rotateOverlayKey", () => {
  it("returns null when there is no profile", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(null);
    expect(await rotateOverlayKey("user-1")).toBeNull();
  });

  it("writes a new well-formed key", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ id: "creator-1" });
    mockPrisma.creatorProfile.update.mockImplementation(
      ({ data }: { data: { overlayKey: string } }) =>
        Promise.resolve(profileRow({ overlayKey: data.overlayKey }))
    );

    const kit = await rotateOverlayKey("user-1");

    expect(kit).not.toBeNull();
    expect(isOverlayKeyFormat(kit?.overlayKey ?? "")).toBe(true);
    expect(kit?.overlayKey).not.toBe("aaaaaaaaaaaaaaaaaaaaaa");
  });
});

describe("resetSession", () => {
  it("returns null when there is no profile", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue(null);
    expect(await resetSession("user-1", new Date())).toBeNull();
  });

  it("stores the given start", async () => {
    const startAt = new Date("2026-08-18T18:00:00.000Z");
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ id: "creator-1" });
    mockPrisma.creatorProfile.update.mockResolvedValue(profileRow({ sessionStartedAt: startAt }));

    const kit = await resetSession("user-1", startAt);

    expect(kit?.sessionStartedAt).toBe("2026-08-18T18:00:00.000Z");
  });

  // Clearing is how a creator gets back to the "since local midnight" default.
  it("clears the start when passed null", async () => {
    mockPrisma.creatorProfile.findUnique.mockResolvedValue({ id: "creator-1" });
    mockPrisma.creatorProfile.update.mockResolvedValue(profileRow({ sessionStartedAt: null }));

    const kit = await resetSession("user-1", null);

    expect(kit?.sessionStartedAt).toBeNull();
    expect(mockPrisma.creatorProfile.update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { sessionStartedAt: null },
    });
  });
});
