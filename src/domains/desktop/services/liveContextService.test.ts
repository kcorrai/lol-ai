import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPersonalMatchup = vi.fn();
const mockGetMatchupData = vi.fn();
const mockGetActiveHabits = vi.fn();
const mockFetchAllChampions = vi.fn();

vi.mock("@/domains/counter", () => ({
  getPersonalMatchup: (...args: unknown[]) => mockGetPersonalMatchup(...args),
}));

vi.mock("@/domains/meta", () => ({
  getMatchupData: (...args: unknown[]) => mockGetMatchupData(...args),
  parsePosition: (raw: string | null) => (raw === "MIDDLE" ? "MIDDLE" : null),
}));

vi.mock("@/domains/analysis", () => ({
  getActiveHabits: (...args: unknown[]) => mockGetActiveHabits(...args),
}));

vi.mock("@/lib/ddragon/championsData", () => ({
  fetchAllChampions: () => mockFetchAllChampions(),
}));

import { getLiveContext } from "@/domains/desktop/services/liveContextService";

const ACCOUNT = "11111111-1111-1111-1111-111111111111";

/** Only the fields this service reads; the real summary carries far more. */
function champion(id: string, key: string, name: string) {
  return { id, key, name };
}

const ROSTER = [
  champion("Ahri", "103", "Ahri"),
  champion("MonkeyKing", "62", "Wukong"),
  champion("Zed", "238", "Zed"),
];

function request(over: Record<string, unknown> = {}) {
  return {
    championName: "Ahri",
    opponentChampionName: "Zed",
    position: "MIDDLE",
    gameMode: "CLASSIC",
    ...over,
  } as Parameters<typeof getLiveContext>[1];
}

function matchupReport(over: Record<string, unknown> = {}) {
  return {
    championA: { key: "Ahri", name: "Ahri" },
    championB: { key: "Zed", name: "Zed" },
    position: "MIDDLE",
    availablePositions: ["MIDDLE"],
    patch: "26.16",
    aWinRateVsB: 47.5,
    games: 4210,
    verdict: "unfavored",
    hints: ["Zed's all-in comes online at 6."],
    ...over,
  };
}

function habit(over: Record<string, unknown> = {}) {
  return {
    id: "h1",
    habitType: "early_deaths",
    displayName: "Dying before ten minutes",
    severity: "high",
    weekCount: 3,
    firstDetected: "2026-08-01",
    lastDetected: "2026-08-20",
    isResolved: false,
    evidence: [],
    message: "You have died before 10:00 in 6 of your last 10 games.",
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchAllChampions.mockResolvedValue(ROSTER);
  mockGetPersonalMatchup.mockResolvedValue(null);
  mockGetMatchupData.mockResolvedValue(null);
  mockGetActiveHabits.mockResolvedValue([]);
});

describe("getLiveContext champion resolution", () => {
  it("passes the Data Dragon id, not the name it was given", async () => {
    mockGetPersonalMatchup.mockResolvedValue(null);
    await getLiveContext(ACCOUNT, request({ championName: "Wukong" }));

    // The game client says "Wukong"; every table in this product keys on "MonkeyKing"
    // and on 62. Sending the display name onward would query a champion nobody has.
    expect(mockGetMatchupData).toHaveBeenCalledWith("MonkeyKing", "Zed", "MIDDLE");
    expect(mockGetPersonalMatchup).toHaveBeenCalledWith(ACCOUNT, 62, 238);
  });

  it("accepts the internal id as well as the display name", async () => {
    const context = await getLiveContext(ACCOUNT, request({ championName: "MonkeyKing" }));
    expect(context.champion).toEqual({ key: "MonkeyKing", name: "Wukong" });
  });

  it("matches regardless of case and surrounding space", async () => {
    const context = await getLiveContext(ACCOUNT, request({ championName: "  ahri " }));
    expect(context.champion).toEqual({ key: "Ahri", name: "Ahri" });
  });

  // The name is free text from a client this code does not control, and it goes on to
  // steer two other domains' queries. An unrecognised one is refused here.
  it("reaches no domain service when the champion is not on the roster", async () => {
    const context = await getLiveContext(ACCOUNT, request({ championName: "Definitely Not" }));

    expect(context.champion).toBeNull();
    expect(context.personal).toBeNull();
    expect(context.meta).toBeNull();
    expect(context.habits).toEqual([]);
    expect(mockGetMatchupData).not.toHaveBeenCalled();
    expect(mockGetPersonalMatchup).not.toHaveBeenCalled();
    expect(mockGetActiveHabits).not.toHaveBeenCalled();
  });

  it("refuses an unrecognised opponent without losing the player's own champion", async () => {
    const context = await getLiveContext(ACCOUNT, request({ opponentChampionName: "Nobody" }));

    expect(context.champion).toEqual({ key: "Ahri", name: "Ahri" });
    expect(context.opponent).toBeNull();
    expect(mockGetMatchupData).not.toHaveBeenCalled();
    expect(mockGetPersonalMatchup).not.toHaveBeenCalled();
  });
});

describe("getLiveContext with no lane opponent", () => {
  // Routine, not an error: ARAM publishes no position, and a lane nobody can name has
  // no opponent to name either.
  it("still answers with the habits, which do not depend on the lane", async () => {
    mockGetActiveHabits.mockResolvedValue([habit()]);

    const context = await getLiveContext(
      ACCOUNT,
      request({ opponentChampionName: null, position: null, gameMode: "ARAM" })
    );

    expect(context.opponent).toBeNull();
    expect(context.meta).toBeNull();
    expect(context.personal).toBeNull();
    expect(context.habits).toHaveLength(1);
  });
});

describe("getLiveContext with no linked Riot account", () => {
  it("says so rather than rendering as an account with no history", async () => {
    mockGetMatchupData.mockResolvedValue(matchupReport());

    const context = await getLiveContext(null, request());

    expect(context.riotAccountLinked).toBe(false);
    expect(context.personal).toBeNull();
    expect(context.habits).toEqual([]);
    expect(mockGetPersonalMatchup).not.toHaveBeenCalled();
    expect(mockGetActiveHabits).not.toHaveBeenCalled();
    // The half that needs no account is still answered — the matchup is public data.
    expect(context.meta).toMatchObject({ winRate: 47.5, verdict: "unfavored" });
  });

  it("reports a linked account as linked even when it has no history at all", async () => {
    const context = await getLiveContext(ACCOUNT, request());
    expect(context.riotAccountLinked).toBe(true);
    expect(context.personal).toBeNull();
  });
});

describe("getLiveContext panels", () => {
  it("carries the player's own record through, rounding KDA for display", async () => {
    mockGetPersonalMatchup.mockResolvedValue({
      opponentChampionId: 238,
      opponentChampionName: "Zed",
      games: 7,
      wins: 3,
      winRate: 43,
      avgKda: 2.33333333,
      trend: "declining",
    });

    const context = await getLiveContext(ACCOUNT, request());

    expect(context.personal).toEqual({
      games: 7,
      wins: 3,
      winRate: 43,
      avgKda: 2.33,
      trend: "declining",
    });
  });

  it("takes only the matchup fields the panel shows", async () => {
    mockGetMatchupData.mockResolvedValue(matchupReport());

    const context = await getLiveContext(ACCOUNT, request());

    expect(context.meta).toEqual({
      position: "MIDDLE",
      patch: "26.16",
      winRate: 47.5,
      games: 4210,
      verdict: "unfavored",
      hints: ["Zed's all-in comes online at 6."],
    });
    // `availablePositions` steers a lane selector this app does not have.
    expect(context.meta).not.toHaveProperty("availablePositions");
  });

  it("passes an unrecognised position as no position at all", async () => {
    await getLiveContext(ACCOUNT, request({ position: "UTILITY-ish" }));
    // Rather than as a lane, which would have `getMatchupData` resolve a lane neither
    // champion plays instead of picking the one they share.
    expect(mockGetMatchupData).toHaveBeenCalledWith("Ahri", "Zed", undefined);
  });

  // The app has one screen, not a report.
  it("caps the habits at three, keeping the order they were detected in", async () => {
    mockGetActiveHabits.mockResolvedValue([
      habit({ habitType: "a" }),
      habit({ habitType: "b" }),
      habit({ habitType: "c" }),
      habit({ habitType: "d" }),
    ]);

    const context = await getLiveContext(ACCOUNT, request());

    expect(context.habits.map((h) => h.habitType)).toEqual(["a", "b", "c"]);
  });

  it("drops the fields a habit carries for the website's own page", async () => {
    mockGetActiveHabits.mockResolvedValue([habit()]);

    const [only] = (await getLiveContext(ACCOUNT, request())).habits;

    expect(only).toEqual({
      habitType: "early_deaths",
      displayName: "Dying before ten minutes",
      severity: "high",
      message: "You have died before 10:00 in 6 of your last 10 games.",
    });
  });
});

describe("getLiveContext when a read fails", () => {
  // A snapshot briefly out of reach should cost the meta panel, not the whole dashboard —
  // the player is mid-game and the panels that can answer should answer.
  it("keeps the other panels when the meta snapshot throws", async () => {
    mockGetMatchupData.mockRejectedValue(new Error("snapshot unavailable"));
    mockGetActiveHabits.mockResolvedValue([habit()]);
    mockGetPersonalMatchup.mockResolvedValue({
      opponentChampionId: 238,
      opponentChampionName: "Zed",
      games: 7,
      wins: 3,
      winRate: 43,
      avgKda: 2.3,
      trend: "stable",
    });

    const context = await getLiveContext(ACCOUNT, request());

    expect(context.meta).toBeNull();
    expect(context.personal).not.toBeNull();
    expect(context.habits).toHaveLength(1);
  });

  it("keeps the meta panel when the account's own reads throw", async () => {
    mockGetPersonalMatchup.mockRejectedValue(new Error("db down"));
    mockGetActiveHabits.mockRejectedValue(new Error("db down"));
    mockGetMatchupData.mockResolvedValue(matchupReport());

    const context = await getLiveContext(ACCOUNT, request());

    expect(context.personal).toBeNull();
    expect(context.habits).toEqual([]);
    expect(context.meta).not.toBeNull();
  });
});
