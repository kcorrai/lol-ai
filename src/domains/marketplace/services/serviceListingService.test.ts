import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  createListing,
  updateListing,
  setListingActive,
  deleteListing,
  listOwnListings,
} from "@/domains/marketplace/services/serviceListingService";
import type { ListingInput } from "@/domains/marketplace/services/serviceListingService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coachProfile: { findUnique: vi.fn() },
    coachListing: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma, true);

const VOD: ListingInput = {
  kind: "VOD_REVIEW",
  title: "One game, reviewed properly",
  description: "x".repeat(40),
  durationMinutes: 60,
  priceCents: 3000,
  currency: "USD",
  deliveryHours: 48,
};

const LIVE: ListingInput = { ...VOD, kind: "LIVE_SESSION", deliveryHours: 48 };

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.coachProfile.findUnique.mockResolvedValue({ id: "profile-1" } as never);
  mockPrisma.coachListing.count.mockResolvedValue(2 as never);
  mockPrisma.coachListing.create.mockResolvedValue({ id: "listing-1" } as never);
  mockPrisma.coachListing.updateMany.mockResolvedValue({ count: 1 } as never);
  mockPrisma.coachListing.findUniqueOrThrow.mockResolvedValue({ id: "listing-1" } as never);
});

describe("createListing", () => {
  it("appends to the coach's own ordering", async () => {
    const result = await createListing("user-1", VOD);

    expect(result.ok).toBe(true);
    expect(mockPrisma.coachListing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ coachProfileId: "profile-1", sortOrder: 2 }),
      })
    );
  });

  // A scheduled session has a slot, not a promised turnaround. Storing one
  // would be a promise nothing could ever be measured against.
  it("nulls the turnaround on the scheduled kinds rather than storing a lie", async () => {
    await createListing("user-1", LIVE);

    expect(mockPrisma.coachListing.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deliveryHours: null }) })
    );
  });

  it("keeps the turnaround on an async review", async () => {
    await createListing("user-1", VOD);

    expect(mockPrisma.coachListing.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deliveryHours: 48 }) })
    );
  });

  it("refuses an async review with no turnaround at all", async () => {
    const result = await createListing("user-1", { ...VOD, deliveryHours: null });

    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(mockPrisma.coachListing.create).not.toHaveBeenCalled();
  });

  it.each([
    ["under the floor", 100],
    ["over the ceiling", 500_000],
  ])("refuses a price %s", async (_label, priceCents) => {
    const result = await createListing("user-1", { ...VOD, priceCents });

    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(mockPrisma.coachListing.create).not.toHaveBeenCalled();
  });

  it.each([
    ["too short", 5],
    ["too long", 600],
  ])("refuses a session %s", async (_label, durationMinutes) => {
    const result = await createListing("user-1", { ...VOD, durationMinutes });

    expect(result).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("refuses when the caller has no coach profile", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(null as never);

    expect(await createListing("user-1", VOD)).toEqual({ ok: false, reason: "no-profile" });
  });

  // Listings can be prepared before approval — the storefront filters on the
  // profile's status, so nothing leaks by letting a draft coach get ready.
  it("does not require the profile to be approved", async () => {
    await createListing("user-1", VOD);

    expect(mockPrisma.coachProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { id: true },
    });
  });
});

describe("updateListing", () => {
  // Scoped by owner in the same statement, so a guessed id belonging to another
  // coach updates nothing rather than updating theirs.
  it("scopes the write to the caller's own profile", async () => {
    await updateListing("user-1", "listing-9", VOD);

    expect(mockPrisma.coachListing.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "listing-9", coachProfileId: "profile-1" },
      })
    );
  });

  it("reports not-found when the row was not the caller's", async () => {
    mockPrisma.coachListing.updateMany.mockResolvedValue({ count: 0 } as never);

    expect(await updateListing("user-1", "somebody-elses", VOD)).toEqual({
      ok: false,
      reason: "not-found",
    });
    expect(mockPrisma.coachListing.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("validates before writing", async () => {
    const result = await updateListing("user-1", "listing-1", { ...VOD, priceCents: 1 });

    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(mockPrisma.coachListing.updateMany).not.toHaveBeenCalled();
  });
});

describe("setListingActive", () => {
  it("toggles only the caller's own listing", async () => {
    expect(await setListingActive("user-1", "listing-1", false)).toBe(true);

    expect(mockPrisma.coachListing.updateMany).toHaveBeenCalledWith({
      where: { id: "listing-1", coachProfileId: "profile-1" },
      data: { isActive: false },
    });
  });

  it("is false when nothing matched", async () => {
    mockPrisma.coachListing.updateMany.mockResolvedValue({ count: 0 } as never);

    expect(await setListingActive("user-1", "nope", true)).toBe(false);
  });
});

describe("deleteListing", () => {
  it("deletes one nothing has been booked against", async () => {
    mockPrisma.coachListing.findFirst.mockResolvedValue({
      id: "listing-1",
      _count: { bookings: 0 },
    } as never);

    const result = await deleteListing("user-1", "listing-1");

    expect(result.ok).toBe(true);
    expect(mockPrisma.coachListing.delete).toHaveBeenCalledWith({ where: { id: "listing-1" } });
  });

  // The booking snapshots its own price, but the listing row is what tells a
  // dispute what was actually being sold.
  it("refuses to delete one that has been booked, and says to take it off sale", async () => {
    mockPrisma.coachListing.findFirst.mockResolvedValue({
      id: "listing-1",
      _count: { bookings: 3 },
    } as never);

    const result = await deleteListing("user-1", "listing-1");

    expect(result).toMatchObject({ ok: false, reason: "invalid" });
    expect(result.ok === false && result.detail).toMatch(/off sale/i);
    expect(mockPrisma.coachListing.delete).not.toHaveBeenCalled();
  });

  it("refuses an id that is not the caller's", async () => {
    mockPrisma.coachListing.findFirst.mockResolvedValue(null as never);

    expect(await deleteListing("user-1", "somebody-elses")).toEqual({
      ok: false,
      reason: "not-found",
    });
  });
});

describe("listOwnListings", () => {
  it("returns nothing at all for a user with no coach profile", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(null as never);

    expect(await listOwnListings("user-1")).toEqual([]);
    expect(mockPrisma.coachListing.findMany).not.toHaveBeenCalled();
  });

  it("includes inactive listings — this is the management view", async () => {
    mockPrisma.coachListing.findMany.mockResolvedValue([] as never);

    await listOwnListings("user-1");

    const call = mockPrisma.coachListing.findMany.mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(call.where).toEqual({ coachProfileId: "profile-1" });
  });
});
