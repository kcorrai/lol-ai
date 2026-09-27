import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/domains/esports/services/leagueService", () => ({
  getTournamentIndex: vi.fn(),
}));
vi.mock("@/domains/esports/services/standingsService", () => ({
  getStandings: vi.fn(),
}));

import { getTournamentOverview } from "./tournamentOverviewService";
import { getTournamentIndex } from "@/domains/esports/services/leagueService";
import { getStandings } from "@/domains/esports/services/standingsService";
import type { EsportsLeague, StandingsStage } from "@/domains/esports/types";

const mockIndex = getTournamentIndex as unknown as ReturnType<typeof vi.fn>;
const mockStandings = getStandings as unknown as ReturnType<typeof vi.fn>;

const LEAGUE: EsportsLeague = {
  id: "l",
  slug: "lec",
  name: "LEC",
  region: "EMEA",
  image: null,
  displayStatus: "selected",
  displayPosition: 0,
};

function entry(slug: string, startDate: string | null, endDate: string | null) {
  return { tournament: { id: slug, slug, startDate, endDate, leagueId: "l" }, league: LEAGUE };
}

const FINAL: StandingsStage = {
  kind: "bracket",
  stageName: "Playoffs",
  sectionName: "Playoffs",
  matches: [
    {
      matchId: "final",
      state: "completed",
      previousMatchIds: [],
      teams: [
        {
          id: "g2",
          slug: null,
          name: "G2 Esports",
          code: "G2",
          image: null,
          decided: true,
          gameWins: 3,
          outcome: "win",
        },
        {
          id: "koi",
          slug: null,
          name: "Movistar KOI",
          code: "MKOI",
          image: null,
          decided: true,
          gameWins: 0,
          outcome: "loss",
        },
      ],
    },
  ],
};

const NOW = new Date("2026-09-27T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  mockStandings.mockResolvedValue([FINAL]);
});

describe("getTournamentOverview", () => {
  it("splits tournaments around today and names finished champions", async () => {
    mockIndex.mockResolvedValue([
      entry("lec_split_3_2026", "2026-07-23", "2026-09-20"),
      entry("worlds_2026", "2026-10-20", "2026-11-20"),
      entry("wsci_2026", "2026-09-19", "2026-10-02"),
    ]);

    const overview = await getTournamentOverview(NOW);

    expect(overview.today).toBe("2026-09-27");
    expect(overview.running.map((e) => e.tournament.slug)).toEqual(["wsci_2026"]);
    expect(overview.upcoming.map((e) => e.tournament.slug)).toEqual(["worlds_2026"]);
    expect(overview.finished[0].champion?.winner.name).toBe("G2 Esports");
    expect(mockStandings).toHaveBeenCalledTimes(1);
    expect(mockStandings).toHaveBeenCalledWith("lec_split_3_2026");
  });

  it("leaves out upcoming splits beyond the horizon and undated ones", async () => {
    mockIndex.mockResolvedValue([
      entry("next_year", "2027-06-01", "2027-08-01"),
      entry("undated", null, null),
    ]);

    const overview = await getTournamentOverview(NOW);

    expect(overview.upcoming).toEqual([]);
    expect(overview.running).toEqual([]);
  });

  it("reads standings for the newest six finished tournaments only", async () => {
    mockIndex.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) =>
        entry(`old_${i}`, `2025-0${i + 1}-01`, `2025-0${i + 1}-20`)
      )
    );

    const overview = await getTournamentOverview(NOW);

    expect(overview.finished).toHaveLength(6);
    expect(overview.finished[0].tournament.slug).toBe("old_8");
    expect(mockStandings).toHaveBeenCalledTimes(6);
  });

  it("keeps a finished tournament whose standings are empty, without a champion", async () => {
    mockIndex.mockResolvedValue([entry("quiet", "2026-01-01", "2026-02-01")]);
    mockStandings.mockResolvedValue([]);

    const overview = await getTournamentOverview(NOW);

    expect(overview.finished[0].champion).toBeNull();
  });
});
