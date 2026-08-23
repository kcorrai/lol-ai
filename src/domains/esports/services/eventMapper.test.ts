import { describe, it, expect } from "vitest";
import { mapEvent } from "./eventMapper";

function raw(overrides: Record<string, unknown> = {}): unknown {
  return {
    startTime: "2026-08-16T09:00:00Z",
    state: "inProgress",
    type: "match",
    blockName: null,
    league: { name: "LCP", slug: "lcp" },
    match: {
      id: "m-1",
      strategy: { count: 3 },
      teams: [
        { name: "Team A", code: "TA" },
        { name: "Team B", code: "TB" },
      ],
    },
    ...overrides,
  };
}

// One stream as the live endpoint actually publishes it.
const twitch = {
  parameter: "lolpacificen",
  locale: "en-SG",
  mediaLocale: {
    locale: "en-SG",
    englishName: "English (Singapore)",
    translatedName: "English (Singapore)",
  },
  provider: "twitch",
  countries: [],
  offset: -30000,
  statsStatus: "enabled",
};

describe("mapEvent — streams", () => {
  it("keeps the broadcasts a live event publishes, with their language", () => {
    const event = mapEvent(raw({ streams: [twitch] }) as never);

    expect(event?.streams).toEqual([
      {
        provider: "twitch",
        parameter: "lolpacificen",
        locale: "en-SG",
        language: "English (Singapore)",
      },
    ]);
  });

  it("falls back to the raw locale when the feed has no translated name", () => {
    const event = mapEvent(raw({ streams: [{ ...twitch, mediaLocale: null }] }) as never);

    expect(event?.streams[0].language).toBe("en-SG");
  });

  it("drops a stream with no provider or no parameter rather than half-mapping it", () => {
    const event = mapEvent(
      raw({
        streams: [twitch, { ...twitch, parameter: null }, { ...twitch, provider: null }],
      }) as never
    );

    expect(event?.streams).toHaveLength(1);
  });

  it("maps the schedule payload, which carries no streams at all, to an empty list", () => {
    // `getSchedule` omits the field entirely; the absence must not be undefined
    // at the call site.
    expect(mapEvent(raw() as never)?.streams).toEqual([]);
  });
});
