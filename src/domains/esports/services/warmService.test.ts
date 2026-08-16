import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const getLiveEvents = vi.fn<(force?: boolean) => Promise<unknown[]>>();
const getUpcoming = vi.fn<(query?: unknown) => Promise<unknown[]>>();
const getCompleted = vi.fn<(query?: unknown) => Promise<unknown[]>>();
const getProSample = vi.fn<(query?: unknown) => Promise<unknown>>();
const getTeams = vi.fn<() => Promise<unknown[]>>();
const getVodArchive = vi.fn<(options?: unknown) => Promise<unknown[]>>();
const getLeagues = vi.fn<() => Promise<unknown[]>>();
const getCurrentTournament = vi.fn<(id: string) => Promise<unknown>>();
const getStandings = vi.fn<(id: string, force?: boolean) => Promise<unknown[]>>();

vi.mock("@/domains/esports/services/scheduleService", () => ({
  getLiveEvents: (force?: boolean) => getLiveEvents(force),
  getUpcoming: (query?: unknown) => getUpcoming(query),
  getCompleted: (query?: unknown) => getCompleted(query),
}));
vi.mock("@/domains/esports/services/proSampleService", () => ({
  getProSample: (query?: unknown) => getProSample(query),
}));
vi.mock("@/domains/esports/services/teamService", () => ({ getTeams: () => getTeams() }));
vi.mock("@/domains/esports/services/vodArchiveService", () => ({
  getVodArchive: (options?: unknown) => getVodArchive(options),
}));
vi.mock("@/domains/esports/services/standingsService", () => ({
  getStandings: (id: string, force?: boolean) => getStandings(id, force),
}));
vi.mock("@/domains/esports/services/leagueService", async () => {
  const actual =
    await vi.importActual<typeof import("@/domains/esports/services/leagueService")>(
      "@/domains/esports/services/leagueService"
    );
  return {
    prominentLeagues: actual.prominentLeagues,
    getLeagues: () => getLeagues(),
    getCurrentTournament: (id: string) => getCurrentTournament(id),
  };
});

import { warmEsports, warmTasks } from "./warmService";

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentTournament.mockResolvedValue(null);
  getStandings.mockResolvedValue([]);
  getLiveEvents.mockResolvedValue([]);
  getUpcoming.mockResolvedValue([]);
  getCompleted.mockResolvedValue([]);
  getProSample.mockResolvedValue(null);
  getTeams.mockResolvedValue([]);
  getVodArchive.mockResolvedValue([]);
  getLeagues.mockResolvedValue([]);
});

/** The full list costs this much; a budget at or above it warms everything. */
const FULL_COST = warmTasks().reduce((sum, task) => sum + task.cost, 0);

describe("warmEsports", () => {
  it("warms everything when the budget covers the list", async () => {
    const report = await warmEsports({ budget: FULL_COST });

    expect(report.warmed).toEqual(warmTasks().map((task) => task.name));
    expect(report.skipped).toEqual([]);
    expect(report.spent).toBe(FULL_COST);
  });

  it("forces a refresh rather than reading whatever is already cached", async () => {
    await warmEsports({ budget: FULL_COST });

    // The whole point: without `force` a warm run can only fill an entry that
    // has already expired, which is one reader too late.
    expect(getLiveEvents).toHaveBeenCalledWith(true);
    expect(getUpcoming).toHaveBeenCalledWith(expect.objectContaining({ force: true }));
    expect(getCompleted).toHaveBeenCalledWith(expect.objectContaining({ force: true }));
    expect(getProSample).toHaveBeenCalledWith({ force: true });
  });

  it("spends the budget in priority order and reports what it dropped", async () => {
    // Enough for live (1) and schedule (3), not for the pro sample (150).
    const report = await warmEsports({ budget: 4 });

    expect(report.warmed).toEqual(["live", "schedule"]);
    expect(report.skipped).toContain("pro-sample");
    expect(getProSample).not.toHaveBeenCalled();
  });

  it("keeps going down the list when a cheap task still fits after an expensive skip", async () => {
    // 6 covers live, schedule, vods and teams, but never the pro sample or
    // standings — and teams sits after both of those in the list.
    const report = await warmEsports({ budget: 6 });

    expect(report.warmed).toEqual(["live", "schedule", "vods", "teams"]);
    expect(report.skipped).toEqual(["pro-sample", "standings"]);
  });

  it("counts a failed task's cost, because it still spent the requests", async () => {
    getProSample.mockRejectedValue(new Error("feed is down"));

    const report = await warmEsports({ budget: FULL_COST });

    expect(report.failed).toEqual(["pro-sample"]);
    expect(report.spent).toBe(FULL_COST);
  });

  it("does not let one failure stop the tasks after it", async () => {
    getProSample.mockRejectedValue(new Error("feed is down"));

    const report = await warmEsports({ budget: FULL_COST });

    // The pro sample failing is no reason to leave the standings cold.
    expect(report.warmed).toContain("standings");
    expect(report.warmed).toContain("teams");
  });

  it("never throws, whatever the feed does", async () => {
    getLiveEvents.mockRejectedValue(new Error("down"));
    getUpcoming.mockRejectedValue(new Error("down"));
    getCompleted.mockRejectedValue(new Error("down"));
    getProSample.mockRejectedValue(new Error("down"));
    getTeams.mockRejectedValue(new Error("down"));
    getVodArchive.mockRejectedValue(new Error("down"));
    getLeagues.mockRejectedValue(new Error("down"));

    const report = await warmEsports({ budget: FULL_COST });

    expect(report.warmed).toEqual([]);
    expect(report.failed).toHaveLength(warmTasks().length);
  });

  it("refreshes standings for the leagues it is given", async () => {
    getLeagues.mockResolvedValue([
      {
        id: "l-1",
        slug: "lck",
        name: "LCK",
        region: "KOREA",
        image: null,
        displayStatus: "selected",
        displayPosition: 0,
      },
    ] as never);
    getCurrentTournament.mockResolvedValue({ id: "t-1" } as never);

    await warmEsports({ budget: FULL_COST });

    expect(getStandings).toHaveBeenCalledWith("t-1", true);
  });
});
