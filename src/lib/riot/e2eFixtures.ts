/**
 * What the Riot API answers during an end-to-end run.
 *
 * `playwright.config.ts` sets `E2E_MOCK=true` so the suite reads fixtures instead of going to
 * Riot. That flag used to be checked at the top of three functions in `riotApiClient`, which left
 * the other eight going to the real API with the fake key `e2e-fake-riot-api-key` and quietly
 * collecting 401s — invisible under `next dev`, and paid for on every CI run (LA-71).
 *
 * The check now lives at the one place every Riot request leaves from, so an endpoint cannot
 * escape by being written later. An endpoint with no fixture **throws by name** rather than
 * falling through to the network: a loud error is worth more than a silent 401.
 */

/** Whether this process should answer Riot calls from fixtures rather than the network. */
export function isRiotMocked(): boolean {
  return process.env.E2E_MOCK === "true";
}

/**
 * The PUUID a mocked account resolves to.
 *
 * Derived from the game name alone because that is all the Riot URL carries — account-v1 is
 * addressed by *routing cluster* (europe), not by platform (euw1), so a platform-suffixed id
 * could not be reconstructed here. Exported so `tests/e2e/helpers/constants.ts` can seed the same
 * value instead of restating the rule; it was written out twice before and nothing tied the two
 * copies together.
 */
export function e2eMockPuuid(gameName: string): string {
  return `e2e-puuid-${gameName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}

/** A fixture is either a body to return or a status to fail with, mirroring what fetch can do. */
export type RiotFixture = { kind: "json"; body: unknown } | { kind: "status"; status: number };

/** Riot's paths, in the order they are matched. */
const MATCHERS: { test: RegExp; build: (m: RegExpMatchArray) => RiotFixture }[] = [
  // Preflight for unattended jobs. The caller ignores the body entirely.
  {
    test: /\/lol\/status\/v4\/platform-data/,
    build: () => ({ kind: "json", body: {} }),
  },

  // account-v1 by Riot ID: /accounts/by-riot-id/{gameName}/{tagLine}
  {
    test: /\/riot\/account\/v1\/accounts\/by-riot-id\/([^/?]+)\/([^/?]+)/,
    build: (m) => {
      const gameName = decodeURIComponent(m[1]);
      const tagLine = decodeURIComponent(m[2]);
      return { kind: "json", body: { puuid: e2eMockPuuid(gameName), gameName, tagLine } };
    },
  },

  // account-v1 by PUUID — the reverse lookup the RTBF sweep uses.
  {
    test: /\/riot\/account\/v1\/accounts\/by-puuid\/([^/?]+)/,
    build: (m) => ({
      kind: "json",
      body: { puuid: decodeURIComponent(m[1]), gameName: "E2EPlayer", tagLine: "E2E" },
    }),
  },

  {
    test: /\/lol\/summoner\/v4\/summoners\/by-puuid\/([^/?]+)/,
    build: (m) => {
      const puuid = decodeURIComponent(m[1]);
      return {
        kind: "json",
        body: {
          id: `e2e-summoner-${puuid.slice(-8)}`,
          accountId: `e2e-account-${puuid.slice(-8)}`,
          puuid,
          name: puuid.split("-")[2] ?? "E2EPlayer",
          profileIconId: 588,
          // Fixed rather than `Date.now()`: a value that moves every run is a value a test can
          // accidentally depend on and then fail on a slow machine.
          revisionDate: 1_700_000_000_000,
          summonerLevel: 100,
        },
      };
    },
  },

  /**
   * Empty history on purpose.
   *
   * The suite seeds its matches straight into the database, so a sync that finds nothing is the
   * deterministic answer — and it keeps `getMatch` and `getMatchTimeline` off the path entirely
   * rather than needing a plausible fixture for a match nobody asked about.
   */
  {
    test: /\/lol\/match\/v5\/matches\/by-puuid\/[^/?]+\/ids/,
    build: () => ({ kind: "json", body: [] }),
  },

  /**
   * No such match, and no such timeline.
   *
   * A 404 rather than an invented `MatchDTO`: the suite seeds its matches into the database
   * directly, so Riot genuinely does not know them, and a hand-written match body would be a
   * hundred fields of fiction for the mapper to trip over. It also flows through
   * `normalizeRiotError` into the handling callers already have, which throwing an unmocked-endpoint
   * error would not.
   */
  {
    test: /\/lol\/match\/v5\/matches\/[^/?]+\/timeline/,
    build: () => ({ kind: "status", status: 404 }),
  },
  {
    test: /\/lol\/match\/v5\/matches\/[^/?]+$/,
    build: () => ({ kind: "status", status: 404 }),
  },

  // Unranked, which is a real state and the one that needs no invented numbers.
  {
    test: /\/lol\/league\/v4\/entries\/by-(puuid|summoner)\/[^/?]+/,
    build: () => ({ kind: "json", body: [] }),
  },

  {
    test: /\/lol\/champion-mastery\/v4\/champion-masteries\/by-puuid\/[^/?]+/,
    build: () => ({ kind: "json", body: [] }),
  },

  /**
   * Not in a game.
   *
   * Riot answers this with a 404 and `getActiveGame` turns that back into null, so the fixture
   * has to fail the same way — returning a body would put every mocked player in a live match.
   */
  {
    test: /\/lol\/spectator\/v5\/active-games\/by-summoner\/[^/?]+/,
    build: () => ({ kind: "status", status: 404 }),
  },
];

/**
 * Thrown when a mocked run reaches an endpoint nothing has a fixture for.
 *
 * Deliberately not a silent fallthrough: the whole point of the card behind this file is that a
 * call escaping to the network fails in a way nobody reads.
 */
export class UnmockedRiotEndpoint extends Error {
  constructor(url: string) {
    super(
      `E2E_MOCK is on and no fixture matches ${url}. Add one to src/lib/riot/e2eFixtures.ts, ` +
        `or stop the code under test from making this call.`
    );
    this.name = "UnmockedRiotEndpoint";
  }
}

/** The fixture for a Riot URL. Throws `UnmockedRiotEndpoint` when there is none. */
export function riotFixtureFor(url: string): RiotFixture {
  for (const matcher of MATCHERS) {
    const match = url.match(matcher.test);
    if (match) return matcher.build(match);
  }
  throw new UnmockedRiotEndpoint(url);
}
