import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOnboardingState, completeOnboarding } from "./onboardingService";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    profile: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

const userId = "user-1";

describe("getOnboardingState", () => {
  beforeEach(() => vi.clearAllMocks());

  it("treats a missing profile as not completed", async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null as never);
    const state = await getOnboardingState(userId);
    expect(state).toEqual({ completed: false, completedAt: null });
  });

  it("treats a null timestamp as not completed", async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ onboardingCompletedAt: null } as never);
    const state = await getOnboardingState(userId);
    expect(state.completed).toBe(false);
  });

  it("reports completed when the timestamp is set", async () => {
    const at = new Date("2026-07-18T00:00:00Z");
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ onboardingCompletedAt: at } as never);
    const state = await getOnboardingState(userId);
    expect(state).toEqual({ completed: true, completedAt: at });
  });
});

describe("completeOnboarding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets the timestamp and upserts when not yet completed", async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ onboardingCompletedAt: null } as never);
    vi.mocked(prisma.profile.upsert).mockResolvedValue({} as never);

    const state = await completeOnboarding(userId);

    expect(state.completed).toBe(true);
    expect(state.completedAt).toBeInstanceOf(Date);
    expect(prisma.profile.upsert).toHaveBeenCalledOnce();
  });

  it("is idempotent — keeps the original timestamp and does not re-upsert", async () => {
    const original = new Date("2026-01-01T00:00:00Z");
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({ onboardingCompletedAt: original } as never);

    const state = await completeOnboarding(userId);

    expect(state).toEqual({ completed: true, completedAt: original });
    expect(prisma.profile.upsert).not.toHaveBeenCalled();
  });
});
