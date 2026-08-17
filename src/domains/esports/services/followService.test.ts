import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    followedTeam: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));
vi.mock("@/domains/esports/services/teamService", () => ({
  getTeam: vi.fn(),
  getTeams: vi.fn(),
}));

import {
  followTeam,
  followsWithTeams,
  listFollows,
  unfollowTeam,
  MAX_FOLLOWS,
} from "./followService";
import { getTeam, getTeams } from "@/domains/esports/services/teamService";
import { prisma } from "@/lib/db/prisma";

const db = prisma.followedTeam as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockGetTeam = getTeam as unknown as ReturnType<typeof vi.fn>;
const mockGetTeams = getTeams as unknown as ReturnType<typeof vi.fn>;

const FNATIC = {
  id: "98767991866488695",
  slug: "fnatic",
  name: "Fnatic",
  code: "FNC",
  image: null,
  backgroundImage: null,
  status: "active",
  league: { name: "LEC", region: "EMEA" },
  players: [],
};

const AT = new Date("2026-08-17T09:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
  db.count.mockResolvedValue(0);
  db.findUnique.mockResolvedValue(null);
  db.create.mockResolvedValue({ createdAt: AT });
});

describe("followTeam", () => {
  it("stores the feed's team id, not the slug it was asked with", async () => {
    mockGetTeam.mockResolvedValue(FNATIC);

    const result = await followTeam("user-1", "fnatic");

    expect(result).toEqual({
      ok: true,
      entry: {
        teamId: FNATIC.id,
        name: "Fnatic",
        slug: "fnatic",
        followedAt: AT.toISOString(),
      },
    });
    // Slugs are reused across 53 teams and names move between splits — the id
    // is the only handle a follow can survive on.
    expect(db.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { userId: "user-1", teamId: FNATIC.id, teamName: "Fnatic", teamSlug: "fnatic" },
      })
    );
  });

  it("is idempotent — following twice keeps the original timestamp and writes nothing", async () => {
    mockGetTeam.mockResolvedValue(FNATIC);
    const first = new Date("2026-01-01T00:00:00.000Z");
    db.findUnique.mockResolvedValue({ createdAt: first });

    const result = await followTeam("user-1", "fnatic");

    expect(result.ok && result.entry.followedAt).toBe(first.toISOString());
    expect(db.create).not.toHaveBeenCalled();
  });

  it("refuses a team the feed does not publish", async () => {
    mockGetTeam.mockResolvedValue(null);

    expect(await followTeam("user-1", "not-a-team")).toEqual({
      ok: false,
      reason: "unknown-team",
    });
    expect(db.create).not.toHaveBeenCalled();
  });

  it("stops at the follow limit", async () => {
    mockGetTeam.mockResolvedValue(FNATIC);
    db.count.mockResolvedValue(MAX_FOLLOWS);

    expect(await followTeam("user-1", "fnatic")).toEqual({ ok: false, reason: "limit-reached" });
    expect(db.create).not.toHaveBeenCalled();
  });

  it("lets an existing follow through even at the limit", async () => {
    // Otherwise the twentieth follow becomes impossible to re-confirm and the
    // button on that team's page reports a limit the reader is not over.
    mockGetTeam.mockResolvedValue(FNATIC);
    db.count.mockResolvedValue(MAX_FOLLOWS);
    db.findUnique.mockResolvedValue({ createdAt: AT });

    expect((await followTeam("user-1", "fnatic")).ok).toBe(true);
  });
});

describe("unfollowTeam", () => {
  it("reports whether a row went, so unfollowing twice is not an error", async () => {
    db.deleteMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    expect(await unfollowTeam("user-1", "team-1")).toBe(true);
    expect(await unfollowTeam("user-1", "team-1")).toBe(false);
  });

  it("scopes the delete to the user", async () => {
    db.deleteMany.mockResolvedValue({ count: 1 });
    await unfollowTeam("user-1", "team-1");
    expect(db.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", teamId: "team-1" },
    });
  });
});

describe("listFollows", () => {
  it("answers from the stored copy without reading the feed", async () => {
    db.findMany.mockResolvedValue([
      { teamId: "t1", teamName: "Fnatic", teamSlug: "fnatic", createdAt: AT },
    ]);

    expect(await listFollows("user-1")).toEqual([
      { teamId: "t1", name: "Fnatic", slug: "fnatic", followedAt: AT.toISOString() },
    ]);
    expect(mockGetTeams).not.toHaveBeenCalled();
  });
});

describe("followsWithTeams", () => {
  it("keeps a followed team the feed no longer publishes, and marks it", async () => {
    db.findMany.mockResolvedValue([
      { teamId: FNATIC.id, teamName: "Fnatic", teamSlug: "fnatic", createdAt: AT },
      { teamId: "gone", teamName: "Origen", teamSlug: "origen", createdAt: AT },
    ]);
    mockGetTeams.mockResolvedValue([FNATIC]);

    const result = await followsWithTeams("user-1");

    expect(result.map((r) => [r.entry.name, r.live])).toEqual([
      ["Fnatic", true],
      ["Origen", false],
    ]);
  });

  it("does not touch the feed for a reader who follows nobody", async () => {
    db.findMany.mockResolvedValue([]);

    expect(await followsWithTeams("user-1")).toEqual([]);
    expect(mockGetTeams).not.toHaveBeenCalled();
  });
});
