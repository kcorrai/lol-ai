import { beforeEach, describe, expect, it, vi } from "vitest";

const mockQueryRaw = vi.fn();
const mockChampionFindUnique = vi.fn();
const mockGetCached = vi.fn();
const mockSetCached = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
    champion: { findUnique: (...args: unknown[]) => mockChampionFindUnique(...args) },
  },
}));

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: (...args: unknown[]) => mockGetCached(...args),
  setCached: (...args: unknown[]) => mockSetCached(...args),
  buildCacheKey: (type: string, inputs: Record<string, string>) =>
    `${type}:${JSON.stringify(inputs)}`,
}));

import {
  getPersonalMatchup,
  getPersonalMatchups,
} from "@/domains/counter/services/personalCounterService";

const ACCOUNT = "11111111-1111-1111-1111-111111111111";

/** The SQL text of every $queryRaw call, reassembled from its template strings. */
function capturedSql(): string[] {
  return mockQueryRaw.mock.calls.map((call) => (call[0] as string[]).join(" ? "));
}

function row(over: Partial<Record<string, unknown>> = {}) {
  return {
    opponentChampionId: 2,
    opponentChampionName: "Olaf",
    games: BigInt(10),
    wins: BigInt(6),
    killsSum: 50,
    deathsSum: 25,
    assistsSum: 40,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCached.mockResolvedValue(null);
  mockSetCached.mockResolvedValue(undefined);
  mockChampionFindUnique.mockResolvedValue({ name: "Darius" });
});

describe("getPersonalMatchups SQL", () => {
  // LA-38. Every column in this service was written in snake_case, but the schema maps only table
  // names (`@@map`) and leaves columns alone — so Postgres answered every call with
  // `42703: column opp.champion_id does not exist` and the feature never worked once. $queryRaw is
  // untyped at the SQL level, so tsc cannot see this and only a test can.
  it("addresses columns by their real camelCase names, never snake_case", async () => {
    mockQueryRaw.mockResolvedValue([]);
    await getPersonalMatchups(ACCOUNT, 122);

    const sql = capturedSql().join("\n");
    expect(sql).not.toBe("");

    for (const wrong of [
      "champion_id",
      "champion_name",
      "riot_account_id",
      "match_id",
      "team_id",
      "queue_type",
      "game_start",
    ]) {
      expect(sql, `${wrong} is not a column this database has`).not.toContain(wrong);
    }

    // And the right ones are present, quoted — an unquoted camelCase identifier is folded to
    // lowercase by Postgres and fails just as hard.
    for (const right of ['"championId"', '"riotAccountId"', '"matchId"', '"queueType"']) {
      expect(sql).toContain(right);
    }
  });

  it("quotes every identifier the trend query needs too", async () => {
    mockQueryRaw.mockResolvedValueOnce([row()]).mockResolvedValue([]);
    await getPersonalMatchups(ACCOUNT, 122);

    const trendSql = capturedSql().slice(1).join("\n");
    expect(trendSql).toContain('"gameStart"');
    expect(trendSql).toContain('"championId"');
    expect(trendSql).not.toContain("game_start");
  });
});

describe("getPersonalMatchups caching", () => {
  it("returns a cache hit without touching the database", async () => {
    mockGetCached.mockResolvedValue({ championId: 122, best: [], worst: [] });
    await getPersonalMatchups(ACCOUNT, 122);
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  // The empty result used to return without caching, so the account least likely to have data —
  // a new one — re-ran the full self-join on every single request, for ever.
  it("caches the empty result so a player with no matchups is not re-queried each time", async () => {
    mockQueryRaw.mockResolvedValue([]);
    const report = await getPersonalMatchups(ACCOUNT, 122);

    expect(report.totalMatchupsAnalyzed).toBe(0);
    expect(mockSetCached).toHaveBeenCalledTimes(1);
    const [, type, value, ttlDays] = mockSetCached.mock.calls[0];
    expect(type).toBe("personal-matchups");
    expect(value).toMatchObject({ best: [], worst: [], banSuggestion: null });
    // Briefly, so the first qualifying matchup is not hidden for the full hour.
    expect(ttlDays).toBeGreaterThan(0);
    expect(ttlDays).toBeLessThan(0.042);
  });

  it("caches a populated report for the full window", async () => {
    mockQueryRaw.mockResolvedValueOnce([row()]).mockResolvedValue([]);
    await getPersonalMatchups(ACCOUNT, 122);
    expect(mockSetCached.mock.calls[0][3]).toBe(0.042);
  });
});

describe("getPersonalMatchups arithmetic", () => {
  // The old code summed kills+assists in SQL and then added assistsSum again in JS, before
  // dividing the ratio by the game count — which is not an average of anything.
  it("reports aggregate KDA as the ratio of sums, counting assists once", async () => {
    mockQueryRaw.mockResolvedValueOnce([row({ killsSum: 50, deathsSum: 25, assistsSum: 40 })])
      .mockResolvedValue([]);

    const report = await getPersonalMatchups(ACCOUNT, 122);

    // (50 + 40) / 25 = 3.6
    expect(report.best[0].avgKda).toBe(3.6);
  });

  it("does not divide by zero for a deathless run", async () => {
    mockQueryRaw.mockResolvedValueOnce([row({ killsSum: 12, deathsSum: 0, assistsSum: 8 })])
      .mockResolvedValue([]);

    const report = await getPersonalMatchups(ACCOUNT, 122);
    expect(report.best[0].avgKda).toBe(20);
  });

  it("derives win rate and totals from the aggregate row", async () => {
    mockQueryRaw
      .mockResolvedValueOnce([row({ games: BigInt(10), wins: BigInt(6) })])
      .mockResolvedValue([]);

    const report = await getPersonalMatchups(ACCOUNT, 122);
    expect(report.best[0]).toMatchObject({ games: 10, wins: 6, winRate: 60 });
    expect(report.championName).toBe("Darius");
    expect(report.totalMatchupsAnalyzed).toBe(1);
  });
});

describe("getPersonalMatchup", () => {
  it("asks for the one pair rather than reading the whole list", async () => {
    mockQueryRaw.mockResolvedValue([]);
    await getPersonalMatchup(ACCOUNT, 122, 2);

    const [sql] = capturedSql();
    // The plural reads every opponent and filters afterwards; this one names the opponent
    // in the WHERE clause, which is the whole reason it exists.
    expect(sql).toContain('opp."championId"');
    expect(sql).toContain('mp."riotAccountId"');
    expect(sql).toContain('"queueType"');
  });

  // The point of the singular read: a lane sitting sixth in the list is still a lane the
  // player has played, and the live panel must not tell them otherwise.
  it("returns a matchup below the list's minimum sample", async () => {
    mockQueryRaw
      .mockResolvedValueOnce([row({ games: BigInt(1), wins: BigInt(1) })])
      .mockResolvedValue([]);

    const entry = await getPersonalMatchup(ACCOUNT, 122, 2);
    expect(entry).toMatchObject({ games: 1, wins: 1, winRate: 100 });
  });

  it("does not impose the list's HAVING floor", async () => {
    mockQueryRaw.mockResolvedValue([]);
    await getPersonalMatchup(ACCOUNT, 122, 2);
    expect(capturedSql()[0]).not.toContain("HAVING");
  });

  it("answers null when this account has never played the pair", async () => {
    mockQueryRaw.mockResolvedValue([]);
    expect(await getPersonalMatchup(ACCOUNT, 122, 2)).toBeNull();
    // And it does not go looking for a trend in games that do not exist.
    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  it("carries the same arithmetic as the list", async () => {
    mockQueryRaw
      .mockResolvedValueOnce([row({ games: BigInt(10), wins: BigInt(6), killsSum: 50, deathsSum: 25, assistsSum: 40 })])
      .mockResolvedValue([]);

    expect(await getPersonalMatchup(ACCOUNT, 122, 2)).toMatchObject({
      opponentChampionId: 2,
      opponentChampionName: "Olaf",
      winRate: 60,
      avgKda: 3.6,
      trend: "insufficient_data",
    });
  });

  it("reads the trend from the pair's own recent games", async () => {
    const won = (won: boolean) => ({ won });
    mockQueryRaw
      .mockResolvedValueOnce([row()])
      // Newest five won, the five before them lost.
      .mockResolvedValueOnce([...Array(5).fill(won(true)), ...Array(5).fill(won(false))]);

    const entry = await getPersonalMatchup(ACCOUNT, 122, 2);
    expect(entry?.trend).toBe("improving");
    expect(capturedSql()[1]).toContain('opp."championId"');
  });
});
