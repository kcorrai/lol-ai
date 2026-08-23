import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  searchCoaches,
  sortPageByPrice,
} from "@/domains/marketplace/services/coachDiscoveryService";
import { parseSearchQuery } from "@/domains/marketplace/searchQuery";
import type { CoachCard } from "@/domains/marketplace/types";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coachProfile: { findMany: vi.fn(), count: vi.fn() },
    coachRankProof: { findMany: vi.fn() },
  },
}));

const mockPrisma = vi.mocked(prisma, true);

const whereOf = () =>
  (mockPrisma.coachProfile.findMany.mock.calls[0][0] as { where: Record<string, unknown> }).where;

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.coachProfile.findMany.mockResolvedValue([] as never);
  mockPrisma.coachProfile.count.mockResolvedValue(0 as never);
  mockPrisma.coachRankProof.findMany.mockResolvedValue([] as never);
});

describe("searchCoaches", () => {
  // A discovery surface that can be made to leak a draft by adding a parameter
  // is one bad refactor away from doing it, so this is in the base where.
  it("never leaves the approved-and-slugged base filter", async () => {
    await searchCoaches(parseSearchQuery({ role: "TOP", all: "1", sort: "newest" }));

    expect(whereOf()).toMatchObject({ status: "APPROVED", slug: { not: null } });
  });

  it("hides coaches not taking students by default, and shows them on request", async () => {
    await searchCoaches(parseSearchQuery({}));
    expect(whereOf().acceptingStudents).toBe(true);

    vi.clearAllMocks();
    mockPrisma.coachProfile.findMany.mockResolvedValue([] as never);
    mockPrisma.coachProfile.count.mockResolvedValue(0 as never);
    await searchCoaches(parseSearchQuery({ all: "1" }));
    expect(whereOf().acceptingStudents).toBeUndefined();
  });

  it("matches array fields by containment", async () => {
    await searchCoaches(parseSearchQuery({ role: "JUNGLE", lang: "tr", region: "tr1" }));

    expect(whereOf()).toMatchObject({
      roles: { has: "JUNGLE" },
      languages: { has: "tr" },
      regions: { has: "tr1" },
    });
  });

  // "A live session under $40" has to mean one listing that is both — not a
  // live session and, separately, something cheap.
  it("puts the kind and the price ceiling in the same listing predicate", async () => {
    await searchCoaches(parseSearchQuery({ kind: "LIVE_SESSION", maxPrice: "40" }));

    expect(whereOf().listings).toEqual({
      some: { isActive: true, kind: "LIVE_SESSION", priceCents: { lte: 4000 } },
    });
  });

  it("does not add a listing predicate when neither was asked for", async () => {
    await searchCoaches(parseSearchQuery({ role: "TOP" }));

    expect(whereOf().listings).toBeUndefined();
  });

  // A self-reported tier must never satisfy "Diamond and above" — the floor is
  // a claim about the badge, and the badge is only worth something when we read it.
  it("only lets a checked rank satisfy a rank floor", async () => {
    await searchCoaches(parseSearchQuery({ minTier: "DIAMOND" }));

    expect(whereOf().rankProofs).toEqual({
      some: {
        queueType: "RANKED_SOLO_5x5",
        method: { in: ["PLATFORM_CHECKED", "RIOT_VERIFIED"] },
        tier: { in: ["DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"] },
      },
    });
  });

  it("pages by skipping whole pages", async () => {
    await searchCoaches(parseSearchQuery({ page: "3" }));

    const call = mockPrisma.coachProfile.findMany.mock.calls[0][0] as {
      skip: number;
      take: number;
    };
    expect(call.take).toBe(24);
    expect(call.skip).toBe(48);
  });

  it("offers a next page only while one exists", async () => {
    mockPrisma.coachProfile.count.mockResolvedValue(30 as never);
    expect((await searchCoaches(parseSearchQuery({}))).nextCursor).toBe("2");

    mockPrisma.coachProfile.count.mockResolvedValue(24 as never);
    expect((await searchCoaches(parseSearchQuery({}))).nextCursor).toBeNull();
  });

  it("counts against the same filter it lists with", async () => {
    await searchCoaches(parseSearchQuery({ role: "TOP" }));

    const listWhere = whereOf();
    const countWhere = (mockPrisma.coachProfile.count.mock.calls[0][0] as { where: unknown }).where;
    expect(countWhere).toEqual(listWhere);
  });
});

describe("sortPageByPrice", () => {
  const card = (slug: string, fromPriceCents: number | null): CoachCard =>
    ({ slug, fromPriceCents }) as CoachCard;

  it("sorts ascending and descending", () => {
    const page = [card("b", 4500), card("a", 3000), card("c", 6000)];

    expect(sortPageByPrice(page, "asc").map((c) => c.slug)).toEqual(["a", "b", "c"]);
    expect(sortPageByPrice(page, "desc").map((c) => c.slug)).toEqual(["c", "b", "a"]);
  });

  // Nothing on sale has no price to compare, and cannot be the cheapest thing
  // on the page.
  it("puts coaches with nothing on sale last, in both directions", () => {
    const page = [card("none", null), card("a", 3000)];

    expect(sortPageByPrice(page, "asc").map((c) => c.slug)).toEqual(["a", "none"]);
    expect(sortPageByPrice(page, "desc").map((c) => c.slug)).toEqual(["a", "none"]);
  });

  it("does not mutate the page it was given", () => {
    const page = [card("b", 4500), card("a", 3000)];
    sortPageByPrice(page, "asc");
    expect(page.map((c) => c.slug)).toEqual(["b", "a"]);
  });
});
