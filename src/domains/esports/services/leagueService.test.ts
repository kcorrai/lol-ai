import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(async () => null),
  setCached: vi.fn(async () => undefined),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getLeagues, getLeague, getTournamentsForLeague } from "./leagueService";

function league(
  slug: string,
  status: string | null,
  position: number | null,
  extra: Record<string, unknown> = {}
) {
  return {
    id: `id-${slug}`,
    slug,
    name: slug.toUpperCase(),
    region: "EMEA",
    image: `http://static.lolesports.com/leagues/${slug}.png`,
    displayPriority: status === null ? null : { status, position },
    ...extra,
  };
}

function mockFeed(body: unknown): ReturnType<typeof vi.fn> {
  const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body });
  global.fetch = spy as unknown as typeof fetch;
  return spy;
}

describe("getLeagues", () => {
  beforeEach(() => vi.clearAllMocks());

  it("orders by display band, then position, matching Riot's own client", async () => {
    mockFeed({
      data: {
        leagues: [
          league("lck", "not_selected", 0),
          league("lec", "selected", 3),
          league("msi", "force_selected", 1),
          league("worlds", "force_selected", 0),
          league("lcs", "selected", 0),
        ],
      },
    });

    const slugs = (await getLeagues()).map((l) => l.slug);
    expect(slugs).toEqual(["worlds", "msi", "lcs", "lec", "lck"]);
  });

  it("treats an unrecognised or absent display status as the least prominent band", async () => {
    mockFeed({
      data: {
        leagues: [
          league("mystery", "brand_new_status", 0),
          league("nostatus", null, null),
          league("lec", "selected", 0),
        ],
      },
    });

    const leagues = await getLeagues();
    // A status we do not know must not outrank the ones Riot actually features.
    expect(leagues.map((l) => l.slug)).toEqual(["lec", "mystery", "nostatus"]);
    expect(leagues[1].displayStatus).toBe("hidden");
  });

  it("upgrades logo URLs to https", async () => {
    mockFeed({ data: { leagues: [league("lec", "selected", 0)] } });

    expect((await getLeagues())[0].image).toBe("https://static.lolesports.com/leagues/lec.png");
  });

  it("returns an empty list when the feed is down and nothing was cached", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;

    expect(await getLeagues()).toEqual([]);
  });
});

describe("getLeague", () => {
  beforeEach(() => vi.clearAllMocks());

  it("looks a league up by slug, case-insensitively", async () => {
    mockFeed({ data: { leagues: [league("lec", "selected", 0)] } });

    expect((await getLeague("LEC"))?.id).toBe("id-lec");
  });

  it("returns null for an unknown slug", async () => {
    mockFeed({ data: { leagues: [league("lec", "selected", 0)] } });

    expect(await getLeague("not-a-league")).toBeNull();
  });
});

describe("getTournamentsForLeague", () => {
  beforeEach(() => vi.clearAllMocks());

  it("flattens the league wrapper, sorts newest first and attaches the league id", async () => {
    mockFeed({
      data: {
        leagues: [
          {
            tournaments: [
              {
                id: "t1",
                slug: "lec_split_1_2026",
                startDate: "2026-01-16",
                endDate: "2026-03-01",
              },
              {
                id: "t3",
                slug: "lec_split_3_2026",
                startDate: "2026-07-23",
                endDate: "2026-09-20",
              },
              {
                id: "t2",
                slug: "lec_split_2_2026",
                startDate: "2026-03-27",
                endDate: "2026-06-07",
              },
            ],
          },
        ],
      },
    });

    const tournaments = await getTournamentsForLeague("id-lec");
    expect(tournaments.map((t) => t.id)).toEqual(["t3", "t2", "t1"]);
    expect(tournaments[0].leagueId).toBe("id-lec");
  });

  it("tolerates a tournament with no dates", async () => {
    mockFeed({ data: { leagues: [{ tournaments: [{ id: "t1", slug: "tbd" }] }] } });

    const [tournament] = await getTournamentsForLeague("id-lec");
    expect(tournament).toMatchObject({ id: "t1", startDate: null, endDate: null });
  });

  it("returns an empty list when the feed is down", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;

    expect(await getTournamentsForLeague("id-lec")).toEqual([]);
  });
});
