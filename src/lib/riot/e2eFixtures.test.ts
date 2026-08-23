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
  it("throws by name for an endpoint nothing covers", () => {
    expect(() => riotFixtureFor(`${EUW}/lol/some/future/endpoint/v1/thing`)).toThrow(
      UnmockedRiotEndpoint
    );
    expect(() => riotFixtureFor(`${EUW}/lol/some/future/endpoint/v1/thing`)).toThrow(
      /no fixture matches/
    );
  });
});

describe("the client gate", () => {
  const cache: CacheStore = {
    get: async () => null,
    set: async () => {},
    del: async () => {},
    delByPrefix: async () => {},
  };
  const limiter = { consume: async () => {} } as unknown as TokenBucket;

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
