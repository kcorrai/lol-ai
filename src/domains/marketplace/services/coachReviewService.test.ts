import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit/auditService";
import {
  approveApplication,
  rejectApplication,
  suspendCoach,
  reinstateCoach,
  listApplications,
} from "@/domains/marketplace/services/coachReviewService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coachProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));
vi.mock("@/lib/audit/auditService", () => ({ audit: vi.fn() }));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockPrisma = vi.mocked(prisma, true);

const PENDING = {
  id: "profile-1",
  userId: "user-1",
  status: "PENDING" as const,
  slug: null,
  displayName: "Rekkles",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.coachProfile.update.mockResolvedValue({} as never);
  mockPrisma.coachProfile.findMany.mockResolvedValue([] as never);
});

describe("approveApplication", () => {
  it("publishes the coach and assigns a slug", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(PENDING as never);

    const result = await approveApplication("profile-1", "admin-1");

    expect(result).toEqual({ ok: true, slug: "rekkles" });
    expect(mockPrisma.coachProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPROVED",
          slug: "rekkles",
          reviewedById: "admin-1",
        }),
      })
    );
  });

  it("names the admin who decided, in the audit log", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(PENDING as never);

    await approveApplication("profile-1", "admin-1");

    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        actorId: "admin-1",
        action: "coach.application.approved",
        resourceId: "profile-1",
      })
    );
  });

  it("only considers slugs that could actually collide", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(PENDING as never);

    await approveApplication("profile-1", "admin-1");

    expect(mockPrisma.coachProfile.findMany).toHaveBeenCalledWith({
      where: { slug: { startsWith: "rekkles" } },
      select: { slug: true },
    });
  });

  it("suffixes past a taken slug rather than failing", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(PENDING as never);
    mockPrisma.coachProfile.findMany.mockResolvedValue([
      { slug: "rekkles" },
      { slug: "rekkles-2" },
    ] as never);

    expect(await approveApplication("profile-1", "admin-1")).toEqual({
      ok: true,
      slug: "rekkles-3",
    });
  });

  // A URL that has been public is the coach's. Re-approving after a suspension
  // must not move them to a new address and break every link to them.
  it("keeps a slug the coach already had, and does not re-stamp publishedAt", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...PENDING,
      slug: "rekkles",
    } as never);

    const result = await approveApplication("profile-1", "admin-1");

    expect(result).toEqual({ ok: true, slug: "rekkles" });
    expect(mockPrisma.coachProfile.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.coachProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ publishedAt: undefined }),
      })
    );
  });

  it("refuses an application that is not pending", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...PENDING,
      status: "APPROVED",
    } as never);

    expect(await approveApplication("profile-1", "admin-1")).toEqual({
      ok: false,
      reason: "wrong-status",
    });
    expect(mockPrisma.coachProfile.update).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("refuses an id that does not exist", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(null as never);

    expect(await approveApplication("nope", "admin-1")).toEqual({
      ok: false,
      reason: "not-found",
    });
  });
});

describe("rejectApplication", () => {
  it("records the reason on the profile and in the audit log", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(PENDING as never);

    const result = await rejectApplication("profile-1", "admin-1", "Rank could not be checked.");

    expect(result).toEqual({ ok: true, slug: null });
    expect(mockPrisma.coachProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "REJECTED",
          reviewNote: "Rank could not be checked.",
        }),
      })
    );
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "coach.application.rejected",
        metadata: { note: "Rank could not be checked." },
      })
    );
  });

  it("refuses to reject something that was never submitted", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...PENDING,
      status: "DRAFT",
    } as never);

    expect(await rejectApplication("profile-1", "admin-1", "no")).toEqual({
      ok: false,
      reason: "wrong-status",
    });
  });
});

describe("suspendCoach and reinstateCoach", () => {
  it("suspends only a live coach", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...PENDING,
      status: "APPROVED",
      slug: "rekkles",
    } as never);

    expect(await suspendCoach("profile-1", "admin-1", "Chargebacks.")).toEqual({
      ok: true,
      slug: "rekkles",
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "coach.suspended" })
    );
  });

  it("will not suspend someone who was never approved", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(PENDING as never);

    expect(await suspendCoach("profile-1", "admin-1", "x")).toEqual({
      ok: false,
      reason: "wrong-status",
    });
  });

  it("reinstates only from suspension", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...PENDING,
      status: "SUSPENDED",
      slug: "rekkles",
    } as never);

    expect(await reinstateCoach("profile-1", "admin-1", "Resolved.")).toEqual({
      ok: true,
      slug: "rekkles",
    });
  });

  it("will not reinstate a coach who is already live", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...PENDING,
      status: "APPROVED",
    } as never);

    expect(await reinstateCoach("profile-1", "admin-1", "x")).toEqual({
      ok: false,
      reason: "wrong-status",
    });
  });
});

describe("listApplications", () => {
  it("works the queue oldest first", async () => {
    await listApplications();

    expect(mockPrisma.coachProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDING" },
        orderBy: { submittedAt: "asc" },
      })
    );
  });

  it("serialises the rank proofs a reviewer is actually judging on", async () => {
    mockPrisma.coachProfile.findMany.mockResolvedValue([
      {
        ...PENDING,
        headline: "h",
        bio: "b",
        languages: ["en"],
        regions: ["EUW"],
        roles: ["BOTTOM"],
        submittedAt: new Date("2026-08-17T12:00:00.000Z"),
        user: { email: "a@b.c" },
        rankProofs: [
          {
            method: "PLATFORM_CHECKED",
            queueType: "RANKED_SOLO",
            tier: "CHALLENGER",
            division: "I",
            checkedAt: new Date("2026-08-17T06:00:00.000Z"),
          },
        ],
      },
    ] as never);

    const [row] = await listApplications();

    expect(row.email).toBe("a@b.c");
    expect(row.submittedAt).toBe("2026-08-17T12:00:00.000Z");
    expect(row.rankProofs[0]).toEqual({
      method: "PLATFORM_CHECKED",
      queueType: "RANKED_SOLO",
      tier: "CHALLENGER",
      division: "I",
      checkedAt: "2026-08-17T06:00:00.000Z",
    });
  });
});
