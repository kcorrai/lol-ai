import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPersonalMatchup = vi.fn();
const mockGetMatchupData = vi.fn();
const mockGetActiveHabits = vi.fn();
const mockGetActiveChallenges = vi.fn();
const mockGetChampionBaseline = vi.fn();
const mockGetChampionBuild = vi.fn();
const mockFetchItems = vi.fn();
const mockFetchAllChampions = vi.fn();
const mockReadChampionIdentity = vi.fn();

vi.mock("@/domains/counter", () => ({
  getPersonalMatchup: (...args: unknown[]) => mockGetPersonalMatchup(...args),
}));

vi.mock("@/lib/ddragon/itemsData", () => ({
  fetchItems: () => mockFetchItems(),
}));

vi.mock("@/domains/meta", () => ({
  getMatchupData: (...args: unknown[]) => mockGetMatchupData(...args),
  getChampionBuild: (...args: unknown[]) => mockGetChampionBuild(...args),
  parsePosition: (raw: string | null) => (raw === "MIDDLE" ? "MIDDLE" : null),
}));

vi.mock("@/domains/analysis", () => ({
  getActiveHabits: (...args: unknown[]) => mockGetActiveHabits(...args),
  getActiveChallenges: (...args: unknown[]) => mockGetActiveChallenges(...args),
}));

vi.mock("@/domains/champions", () => ({
  getChampionBaseline: (...args: unknown[]) => mockGetChampionBaseline(...args),
}));

vi.mock("@/lib/ddragon/championsData", () => ({
  fetchAllChampions: () => mockFetchAllChampions(),
}));

vi.mock("@/domains/desktop/services/championAbilities", () => ({
  readChampionIdentity: (...args: unknown[]) => mockReadChampionIdentity(...args),
}));

import { getLiveContext } from "@/domains/desktop/services/liveContextService";

const ACCOUNT = "11111111-1111-1111-1111-111111111111";
const USER = "22222222-2222-2222-2222-222222222222";

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
  } as Parameters<typeof getLiveContext>[2];
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

/** As `getActiveChallenges` returns one — progress fields and all, which the app never sees. */
function challenge(over: Record<string, unknown> = {}) {
  return {
    id: "ch-1",
    type: "daily",
    metric: "deaths",
    targetValue: 4,
    description: "Die fewer than 4 times",
    xpReward: 60,
    validFrom: new Date("2026-08-23"),
    validUntil: new Date("2026-08-24"),
    progress: 0.5,
    completed: false,
    completedAt: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchAllChampions.mockResolvedValue(ROSTER);
  mockGetPersonalMatchup.mockResolvedValue(null);
  mockGetMatchupData.mockResolvedValue(null);
  mockGetActiveHabits.mockResolvedValue([]);
  mockGetActiveChallenges.mockResolvedValue([]);
  mockGetChampionBaseline.mockResolvedValue(null);
  mockGetChampionBuild.mockResolvedValue(null);
  mockFetchItems.mockResolvedValue(
    new Map([
      [1055, { name: "Doran's Blade" }],
      [3153, { name: "Blade of the Ruined King" }],
    ])
  );
  mockReadChampionIdentity.mockResolvedValue({ title: null, tags: [], abilities: [] });
});

describe("getLiveContext champion resolution", () => {
  it("passes the Data Dragon id, not the name it was given", async () => {
    mockGetPersonalMatchup.mockResolvedValue(null);
    await getLiveContext(ACCOUNT, USER, request({ championName: "Wukong" }));

    // The game client says "Wukong"; every table in this product keys on "MonkeyKing"
    // and on 62. Sending the display name onward would query a champion nobody has.
    expect(mockGetMatchupData).toHaveBeenCalledWith("MonkeyKing", "Zed", "MIDDLE");
    expect(mockGetPersonalMatchup).toHaveBeenCalledWith(ACCOUNT, 62, 238);
  });

  it("accepts the internal id as well as the display name", async () => {
    const context = await getLiveContext(ACCOUNT, USER, request({ championName: "MonkeyKing" }));
    expect(context.champion).toEqual({ key: "MonkeyKing", name: "Wukong" });
  });

  it("matches regardless of case and surrounding space", async () => {
    const context = await getLiveContext(ACCOUNT, USER, request({ championName: "  ahri " }));
    expect(context.champion).toEqual({ key: "Ahri", name: "Ahri" });
  });

  // The name is free text from a client this code does not control, and it goes on to
  // steer two other domains' queries. An unrecognised one is refused here.
  it("reaches no domain service when the champion is not on the roster", async () => {
    const context = await getLiveContext(
      ACCOUNT,
      USER,
      request({ championName: "Definitely Not" })
    );

    expect(context.champion).toBeNull();
    expect(context.personal).toBeNull();
    expect(context.meta).toBeNull();
    expect(context.habits).toEqual([]);
    expect(mockGetMatchupData).not.toHaveBeenCalled();
    expect(mockGetPersonalMatchup).not.toHaveBeenCalled();
    expect(mockGetActiveHabits).not.toHaveBeenCalled();
  });

  it("refuses an unrecognised opponent without losing the player's own champion", async () => {
    const context = await getLiveContext(
      ACCOUNT,
      USER,
      request({ opponentChampionName: "Nobody" })
    );

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
      USER,
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

    const context = await getLiveContext(null, null, request());

    expect(context.riotAccountLinked).toBe(false);
    expect(context.personal).toBeNull();
    expect(context.habits).toEqual([]);
    expect(mockGetPersonalMatchup).not.toHaveBeenCalled();
    expect(mockGetActiveHabits).not.toHaveBeenCalled();
    // The half that needs no account is still answered — the matchup is public data.
    expect(context.meta).toMatchObject({ winRate: 47.5, verdict: "unfavored" });
  });

  it("reports a linked account as linked even when it has no history at all", async () => {
    const context = await getLiveContext(ACCOUNT, USER, request());
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

    const context = await getLiveContext(ACCOUNT, USER, request());

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

    const context = await getLiveContext(ACCOUNT, USER, request());

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
    await getLiveContext(ACCOUNT, USER, request({ position: "UTILITY-ish" }));
    // Rather than as a lane, which would have `getMatchupData` resolve a lane neither
    // champion plays instead of picking the one they share.
    expect(mockGetMatchupData).toHaveBeenCalledWith("Ahri", "Zed", undefined);
  });

  it("asks for the baseline by the resolved name, not the one the game client sent", async () => {
    await getLiveContext(ACCOUNT, USER, request({ championName: "MonkeyKing" }));

    // "MonkeyKing" is Data Dragon's id; "Wukong" is the name every other table stores.
    expect(mockGetChampionBaseline).toHaveBeenCalledWith(ACCOUNT, "Wukong");
  });

  it("carries the baseline through with the sample it came from", async () => {
    mockGetChampionBaseline.mockResolvedValue({
      championName: "Ahri",
      games: 14,
      csPerMin: 7.2,
      deaths: 4.1,
      visionScore: 21.5,
      kda: 3.4,
    });

    const context = await getLiveContext(ACCOUNT, USER, request());

    expect(context.baseline).toEqual({
      games: 14,
      csPerMin: 7.2,
      deaths: 4.1,
      visionScore: 21.5,
      kda: 3.4,
    });
  });

  it("answers with no baseline rather than a made-up one", async () => {
    mockGetChampionBaseline.mockResolvedValue(null);
    mockGetChampionBuild.mockResolvedValue(null);
    mockFetchItems.mockResolvedValue(
      new Map([
        [1055, { name: "Doran's Blade" }],
        [3153, { name: "Blade of the Ruined King" }],
      ])
    );

    expect((await getLiveContext(ACCOUNT, USER, request())).baseline).toBeNull();
  });

  it("sends only the challenges a running game can actually measure", async () => {
    mockGetActiveChallenges.mockResolvedValue([
      challenge({ id: "a", metric: "deaths", targetValue: 4 }),
      // Nothing a mid-match scoreboard can say about a run of games. A goal on screen
      // whose bar cannot move reads as broken, not as not-applicable.
      challenge({ id: "b", metric: "win_streak", targetValue: 3 }),
      challenge({ id: "c", metric: "cs_per_min", targetValue: 6.5 }),
    ]);

    const context = await getLiveContext(ACCOUNT, USER, request());

    expect(context.challenges.map((c) => c.metric)).toEqual(["deaths", "cs_per_min"]);
  });

  it("drops the progress fields the website's own page needs and the app does not", async () => {
    mockGetActiveChallenges.mockResolvedValue([challenge()]);

    const [only] = (await getLiveContext(ACCOUNT, USER, request())).challenges;

    expect(only).toEqual({
      id: "ch-1",
      metric: "deaths",
      targetValue: 4,
      description: "Die fewer than 4 times",
    });
  });

  it("asks for challenges by the user, not the Riot account they are linked to", async () => {
    await getLiveContext(ACCOUNT, USER, request());

    expect(mockGetActiveChallenges).toHaveBeenCalledWith(USER);
  });

  it("answers with no challenges when the device is paired to no user", async () => {
    const context = await getLiveContext(ACCOUNT, null, request());

    expect(context.challenges).toEqual([]);
    expect(mockGetActiveChallenges).not.toHaveBeenCalled();
  });

  it("carries the build with its item ids resolved to names", async () => {
    mockGetChampionBuild.mockResolvedValue({
      skillOrder: ["Q", "W", "E"],
      skillMaxOrder: ["Q", "W", "E"],
      starterItems: { ids: [1055], games: 10, winRate: 50 },
      coreItems: { ids: [3153], games: 8_000, winRate: 52.4 },
      boots: { ids: [], games: 0, winRate: 0 },
    });

    const context = await getLiveContext(ACCOUNT, USER, request());

    expect(context.build?.starters).toEqual([{ id: 1055, name: "Doran's Blade" }]);
    expect(context.build?.core).toEqual([{ id: 3153, name: "Blade of the Ruined King" }]);
    // The sample travels with the build, as every other number here does.
    expect(context.build?.games).toBe(8_000);
    expect(context.build?.winRate).toBe(52.4);
  });

  it("keeps an item the catalogue does not know, with an empty name", async () => {
    // A build that is quietly one item shorter is worse than a gap the player can see.
    mockGetChampionBuild.mockResolvedValue({
      skillOrder: [],
      skillMaxOrder: [],
      starterItems: null,
      coreItems: { ids: [999_999], games: 5, winRate: 50 },
      boots: null,
    });

    const context = await getLiveContext(ACCOUNT, USER, request());

    expect(context.build?.core).toEqual([{ id: 999_999, name: "" }]);
  });

  it("still answers with a build when the item catalogue cannot be read", async () => {
    mockFetchItems.mockRejectedValue(new Error("ddragon down"));
    mockGetChampionBuild.mockResolvedValue({
      skillOrder: ["Q"],
      skillMaxOrder: ["Q"],
      starterItems: null,
      coreItems: { ids: [3153], games: 5, winRate: 50 },
      boots: null,
    });

    const context = await getLiveContext(ACCOUNT, USER, request());

    expect(context.build?.core).toEqual([{ id: 3153, name: "" }]);
  });

  it("asks for no build in a mode with no lane to build for", async () => {
    const context = await getLiveContext(
      ACCOUNT,
      USER,
      request({ opponentChampionName: null, position: null, gameMode: "ARAM" })
    );

    expect(context.build).toBeNull();
    expect(mockGetChampionBuild).not.toHaveBeenCalled();
  });

  it("answers with no build rather than an empty one when the patch has no entry", async () => {
    mockGetChampionBuild.mockResolvedValue(null);

    expect((await getLiveContext(ACCOUNT, USER, request())).build).toBeNull();
  });

  // The app has one screen, not a report.
  it("caps the habits at three, keeping the order they were detected in", async () => {
    mockGetActiveHabits.mockResolvedValue([
      habit({ habitType: "a" }),
      habit({ habitType: "b" }),
      habit({ habitType: "c" }),
      habit({ habitType: "d" }),
    ]);

    const context = await getLiveContext(ACCOUNT, USER, request());

    expect(context.habits.map((h) => h.habitType)).toEqual(["a", "b", "c"]);
  });

  it("drops the fields a habit carries for the website's own page", async () => {
    mockGetActiveHabits.mockResolvedValue([habit()]);

    const [only] = (await getLiveContext(ACCOUNT, USER, request())).habits;

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

    const context = await getLiveContext(ACCOUNT, USER, request());

    expect(context.meta).toBeNull();
    expect(context.personal).not.toBeNull();
    expect(context.habits).toHaveLength(1);
  });

  it("keeps the meta panel when the account's own reads throw", async () => {
    mockGetPersonalMatchup.mockRejectedValue(new Error("db down"));
    mockGetActiveHabits.mockRejectedValue(new Error("db down"));
    mockGetMatchupData.mockResolvedValue(matchupReport());

    const context = await getLiveContext(ACCOUNT, USER, request());

    expect(context.personal).toBeNull();
    expect(context.habits).toEqual([]);
    expect(context.meta).not.toBeNull();
  });
});

describe("getLiveContext opponent kit", () => {
  const CHARM = {
    slot: "E" as const,
    name: "Charm",
    description: "Ahri blows a kiss.",
    iconUrl: "https://ddragon.leagueoflegends.com/x/AhriSeduce.png",
    videoUrl: "https://d28xe8vt774jo5.cloudfront.net/champion-abilities/0103/ability_0103_E1.webm",
    cooldown: "14/13/12/11/10",
    cost: "50",
    range: "975",
  };

  /** The *opponent's* kit, not the player's: a player knows their own champion. */
  it("reads the kit of the lane opponent", async () => {
    mockReadChampionIdentity.mockResolvedValue({ title: null, tags: [], abilities: [CHARM] });

    const context = await getLiveContext(ACCOUNT, USER, request());

    // The Data Dragon id the roster resolved, never the name the game client sent.
    expect(mockReadChampionIdentity).toHaveBeenCalledWith("Zed");
    expect(context.opponentAbilities).toEqual([CHARM]);
  });

  it("asks for no kit when the game has no lane opponent", async () => {
    const context = await getLiveContext(
      ACCOUNT,
      USER,
      request({ opponentChampionName: null, position: null })
    );

    expect(mockReadChampionIdentity).not.toHaveBeenCalled();
    expect(context.opponentAbilities).toEqual([]);
  });

  /**
   * The catalogue is a different feed from every other read here, so it is a different
   * thing that can be down. It has to cost one panel and leave the rest of the screen up.
   */
  it("keeps the rest of the context when the catalogue read throws", async () => {
    mockReadChampionIdentity.mockRejectedValue(new Error("ddragon down"));
    mockGetMatchupData.mockResolvedValue(matchupReport());

    const context = await getLiveContext(ACCOUNT, USER, request());

    expect(context.opponentAbilities).toEqual([]);
    expect(context.meta).not.toBeNull();
  });
});
