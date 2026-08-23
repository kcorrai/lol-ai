import { afterEach, describe, expect, it, vi } from "vitest";
import { e2eMockPuuid, isRiotMocked, riotFixtureFor, UnmockedRiotEndpoint } from "./e2eFixtures";
import { RiotHttpClient } from "./client";
import type { CacheStore } from "./cache";
import type { TokenBucket } from "./rateLimit";

const EUROPE = "https://europe.api.riotgames.com";
const EUW = "https://euw1.api.riotgames.com";

function body(url: string): unknown {
  const fixture = riotFixtureFor(url);
  if (fixture.kind !== "json") throw new Error(`expected a body, got status ${fixture.status}`);
  return fixture.body;
}

describe("isRiotMocked", () => {
  afterEach(() => {
    delete process.env.E2E_MOCK;
  });

  it("is off unless the flag is exactly true", () => {
    expect(isRiotMocked()).toBe(false);
    process.env.E2E_MOCK = "false";
    expect(isRiotMocked()).toBe(false);
    process.env.E2E_MOCK = "1";
    expect(isRiotMocked()).toBe(false);
    process.env.E2E_MOCK = "true";
    expect(isRiotMocked()).toBe(true);
  });
});

describe("riotFixtureFor", () => {
  it("resolves a Riot ID to the shared mock puuid", () => {
    expect(body(`${EUROPE}/riot/account/v1/accounts/by-riot-id/E2ESmoke/E2E`)).toEqual({
      puuid: e2eMockPuuid("E2ESmoke"),
      gameName: "E2ESmoke",
      tagLine: "E2E",
    });
  });

  it("decodes a percent-encoded name rather than answering about a literal %20", () => {
    expect(
      body(`${EUROPE}/riot/account/v1/accounts/by-riot-id/Hide%20on%20bush/KR1`)
    ).toMatchObject({ gameName: "Hide on bush", tagLine: "KR1" });
  });

  it("answers the reverse lookup with the puuid it was asked about", () => {
    expect(body(`${EUROPE}/riot/account/v1/accounts/by-puuid/abc123`)).toMatchObject({
      puuid: "abc123",
    });
  });

  it("gives a summoner a stable revision date, not a moving one", () => {
    const first = body(`${EUW}/lol/summoner/v4/summoners/by-puuid/e2e-puuid-someone`);
    const second = body(`${EUW}/lol/summoner/v4/summoners/by-puuid/e2e-puuid-someone`);

    expect(first).toEqual(second);
  });

  /** The suite seeds matches straight into the database, so a sync that finds nothing is right. */
  it("reports an empty match history", () => {
    expect(body(`${EUROPE}/lol/match/v5/matches/by-puuid/abc/ids?start=0&count=10`)).toEqual([]);
  });

  it("reports unranked for both league lookups", () => {
    expect(body(`${EUW}/lol/league/v4/entries/by-puuid/abc`)).toEqual([]);
    expect(body(`${EUW}/lol/league/v4/entries/by-summoner/abc`)).toEqual([]);
  });

  it("reports no mastery", () => {
    expect(body(`${EUW}/lol/champion-mastery/v4/champion-masteries/by-puuid/abc`)).toEqual([]);
  });

  /**
   * Riot answers "not in a game" with a 404 and `getActiveGame` turns that back into null.
   * A body here would put every mocked player in a live match.
   */
  it("fails the spectator lookup with a 404 rather than inventing a game", () => {
    expect(riotFixtureFor(`${EUW}/lol/spectator/v5/active-games/by-summoner/abc`)).toEqual({
      kind: "status",
      status: 404,
    });
  });

  it("answers the reachability preflight", () => {
    expect(body(`${EUW}/lol/status/v4/platform-data`)).toEqual({});
  });

  /** The whole point: a call with no fixture must be loud, not a silent 401 from the real API. */
  it("reports no such match, and no such timeline", () => {
    expect(riotFixtureFor(`${EUROPE}/lol/match/v5/matches/EUW1_1`)).toEqual({
      kind: "status",
      status: 404,
    });
    expect(riotFixtureFor(`${EUROPE}/lol/match/v5/matches/EUW1_1/timeline`)).toEqual({
      kind: "status",
      status: 404,
    });
  });

  it("throws by name for an endpoint nothing covers", () => {
    expect(() => riotFixtureFor(`${EUW}/lol/some/future/endpoint/v1/thing`)).toThrow(
      UnmockedRiotEndpoint
    );
    expect(() => riotFixtureFor(`${EUW}/lol/some/future/endpoint/v1/thing`)).toThrow(
      /no fixture matches/
    );
  });
});

/** A cache that never hits, so a test measures the gate rather than a warm entry. */
function emptyCache(): CacheStore {
  return {
    get: async () => null,
    set: async () => {},
    del: async () => {},
    delByPrefix: async () => {},
  };
}

function noLimiter(): TokenBucket {
  return { consume: async () => {} } as unknown as TokenBucket;
}

describe("the client gate", () => {
  const cache = emptyCache();
  const limiter = noLimiter();

  afterEach(() => {
    delete process.env.E2E_MOCK;
    vi.restoreAllMocks();
  });

  /**
   * The defect this file exists for: the flag was checked in three of eleven functions, so the
   * other eight went to the real API with a fake key and collected 401s nobody read (LA-71).
   */
  it("never touches the network when the flag is on", async () => {
    process.env.E2E_MOCK = "true";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const client = new RiotHttpClient("fake-key", cache, limiter);

    const account = await client.get<{ puuid: string }>(
      `${EUROPE}/riot/account/v1/accounts/by-riot-id/E2ESmoke/E2E`,
      { skipRateLimit: true }
    );

    expect(account.puuid).toBe(e2eMockPuuid("E2ESmoke"));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("turns a status fixture into the error the caller already handles", async () => {
    process.env.E2E_MOCK = "true";
    const client = new RiotHttpClient("fake-key", cache, limiter);

    await expect(
      client.get(`${EUW}/lol/spectator/v5/active-games/by-summoner/abc`, { skipRateLimit: true })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("surfaces an unmocked endpoint instead of going out to Riot", async () => {
    process.env.E2E_MOCK = "true";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const client = new RiotHttpClient("fake-key", cache, limiter);

    await expect(
      client.get(`${EUW}/lol/some/future/endpoint/v1/thing`, { skipRateLimit: true })
    ).rejects.toThrow(UnmockedRiotEndpoint);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

/**
 * The card's third ask, as an invariant rather than a one-off observation: an E2E run must make
 * zero requests to the Riot host.
 *
 * Asserted over *every* network function the client module exports, so a function added later
 * that reaches the network another way fails here rather than in CI six months on. Throwing is a
 * pass — a mocked run may legitimately refuse an endpoint. Calling `fetch` is not.
 */
describe("no Riot function reaches the network when mocked", () => {
  afterEach(() => {
    delete process.env.E2E_MOCK;
    vi.restoreAllMocks();
  });

  it("holds for all of them", async () => {
    process.env.E2E_MOCK = "true";
    const api = await import("@/domains/riot/services/riotApiClient");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const calls: [string, Promise<unknown>][] = [
      ["assertRiotApiReachable", api.assertRiotApiReachable("euw1")],
      ["getMatchTimeline", api.getMatchTimeline("EUW1_1", "euw1")],
      ["getAccountByRiotId", api.getAccountByRiotId("E2ESmoke", "E2E", "euw1")],
      ["getAccountByPuuid", api.getAccountByPuuid("puuid-1", "euw1")],
      ["getSummonerByPuuid", api.getSummonerByPuuid("puuid-1", "euw1")],
      ["getMatchIds", api.getMatchIds("puuid-1", "euw1")],
      ["getMatch", api.getMatch("EUW1_1", "euw1")],
      ["getRankedEntries", api.getRankedEntries("summoner-1", "euw1")],
      ["getRankedEntriesByPuuidDirect", api.getRankedEntriesByPuuidDirect("puuid-1", "euw1")],
      ["getChampionMastery", api.getChampionMastery("puuid-1", "euw1")],
      ["getActiveGame", api.getActiveGame("puuid-1", "euw1")],
    ];

    await Promise.allSettled(calls.map(([, promise]) => promise));

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  /**
   * Proves the assertion above has teeth.
   *
   * "fetch was never called" passes just as well when nothing would have called it anyway, which
   * is the failure mode of every assertion that something did *not* happen. The first draft of
   * this control failed for exactly that reason: it reused the module-level client, whose cache
   * the test above had already warmed, so the call never reached the network with the flag off
   * either. A fresh client with an empty cache is the only way the comparison means anything.
   *
   * Fetch is stubbed to reject, so nothing leaves the machine in either direction.
   */
  it("and the same request does reach fetch with the flag off", async () => {
    delete process.env.E2E_MOCK;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("blocked by the test"));
    const client = new RiotHttpClient("fake-key", emptyCache(), noLimiter());

    await client
      .get(`${EUROPE}/riot/account/v1/accounts/by-riot-id/E2ESmoke/E2E`, { skipRateLimit: true })
      .catch(() => {});

    expect(fetchSpy).toHaveBeenCalled();
  });
});
