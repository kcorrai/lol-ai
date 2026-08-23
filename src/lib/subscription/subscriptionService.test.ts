import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    subscription: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { getCurrentSubscription } from "./subscriptionService";

const USER_ID = "user-1";
const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

function onSubscription(sub: Record<string, unknown> | null) {
  vi.mocked(prisma.subscription.findUnique).mockResolvedValue(sub as never);
}

function withTrialEnding(at: Date | null) {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ proTrialEndsAt: at } as never);
}

beforeEach(() => {
  vi.resetAllMocks();
  onSubscription(null);
  withTrialEnding(null);
});

describe("getCurrentSubscription", () => {
  it("falls back to an active free plan when there is no subscription row", async () => {
    const info = await getCurrentSubscription(USER_ID);

    expect(info).toEqual({
      plan: "free",
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      isReferralTrial: false,
      referralTrialEndsAt: null,
    });
  });

  it("reports the stored plan and period", async () => {
    onSubscription({
      plan: "pro",
      status: "active",
      currentPeriodEnd: FUTURE,
      cancelAtPeriodEnd: true,
    });

    const info = await getCurrentSubscription(USER_ID);

    expect(info.plan).toBe("pro");
    expect(info.cancelAtPeriodEnd).toBe(true);
    expect(info.currentPeriodEnd).toEqual(FUTURE);
  });

  // A referral trial grants Pro without a subscription row, so it has to be applied on read.
  it("upgrades a free user to pro during an active referral trial", async () => {
    withTrialEnding(FUTURE);

    const info = await getCurrentSubscription(USER_ID);

    expect(info.plan).toBe("pro");
    expect(info.isReferralTrial).toBe(true);
    expect(info.referralTrialEndsAt).toEqual(FUTURE);
  });

  it("does not extend an expired referral trial", async () => {
    withTrialEnding(PAST);

    const info = await getCurrentSubscription(USER_ID);

    expect(info.plan).toBe("free");
    expect(info.isReferralTrial).toBe(false);
  });

  // The trial must not quietly downgrade someone who is already paying for more.
  it("leaves a paid plan alone during a referral trial", async () => {
    onSubscription({
      plan: "elite",
      status: "active",
      currentPeriodEnd: FUTURE,
      cancelAtPeriodEnd: false,
    });
    withTrialEnding(FUTURE);

    const info = await getCurrentSubscription(USER_ID);

    expect(info.plan).toBe("elite");
    expect(info.isReferralTrial).toBe(true);
  });
});
