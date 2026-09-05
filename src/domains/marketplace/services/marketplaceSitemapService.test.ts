import { describe, it, expect, beforeEach, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { marketplaceSitemapEntries } from "@/domains/marketplace/services/marketplaceSitemapService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coachProfile: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const mockPrisma = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("marketplaceSitemapEntries", () => {
  it("emits the storefront followed by one URL per approved coach", async () => {
    mockPrisma.coachProfile.findMany.mockResolvedValue([
      { slug: "faker", updatedAt: new Date("2026-08-01T00:00:00.000Z") },
      { slug: "caps", updatedAt: new Date("2026-07-01T00:00:00.000Z") },
    ] as never);

    const entries = await marketplaceSitemapEntries();

    expect(entries.map((e) => e.path)).toEqual(["/coaches", "/coaches/faker", "/coaches/caps"]);
    expect(entries[1].lastModified).toEqual(new Date("2026-08-01T00:00:00.000Z"));
  });

  it("still emits the storefront when the coach table has not been migrated yet", async () => {
    // P2021 is what production answered on a90cf442: the release step (ADR-012)
    // had not applied add_coach_marketplace, so the table was simply absent.
    mockPrisma.coachProfile.findMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("The table `public.coach_profiles` does not exist", {
        code: "P2021",
        clientVersion: "test",
      }) as never
    );

    await expect(marketplaceSitemapEntries()).resolves.toEqual([{ path: "/coaches" }]);
  });

  it("still emits the storefront when the database is unreachable", async () => {
    mockPrisma.coachProfile.findMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Can't reach database server", {
        code: "P1001",
        clientVersion: "test",
      }) as never
    );

    await expect(marketplaceSitemapEntries()).resolves.toEqual([{ path: "/coaches" }]);
  });
});
