import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { coachProfile: { findMany: vi.fn() } },
}));
vi.mock("@/domains/marketplace/services/rankBadgeService", () => ({
  badgesFor: vi.fn(),
}));
vi.mock("@/domains/marketplace/services/serviceListingService", () => ({
  publicListings: vi.fn(),
}));
vi.mock("@/domains/marketplace/services/reviewService", () => ({ publicReviews: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { badgesFor } from "@/domains/marketplace/services/rankBadgeService";
import { newCoaches } from "@/domains/marketplace/services/coachSearchService";

const db = vi.mocked(prisma, true);

const ROW = {
  id: "cp-1",
  slug: "fresh",
  displayName: "Fresh Coach",
  headline: "New here",
  languages: ["en"],
  regions: ["euw1"],
  roles: ["MIDDLE"],
  championIds: [],
  ratingBayes: 4.9,
  ratingCount: 1,
  sessionsCompleted: 1,
  acceptingStudents: true,
  listings: [{ priceCents: 2000, currency: "USD" }],
  _count: { listings: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  db.coachProfile.findMany.mockResolvedValue([ROW] as never);
  vi.mocked(badgesFor).mockResolvedValue(new Map());
});

describe("newCoaches", () => {
  it("picks approved coaches taking students who have no rating yet, newest first", async () => {
    await newCoaches(3);

    expect(db.coachProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "APPROVED",
          acceptingStudents: true,
          ratingCount: { lt: expect.any(Number) },
        }),
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        take: 3,
      })
    );
  });

  it("withholds the rating on the card, as everywhere else", async () => {
    const [card] = await newCoaches();

    expect(card.rating).toBeNull();
    expect(card.offersTrial).toBe(true);
    expect(card.fromPriceCents).toBe(2000);
  });
});
