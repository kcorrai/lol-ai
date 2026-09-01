import { describe, it, expect } from "vitest";
import { groupByDay, withinDays } from "./dayGroups";
import type { EsportsEvent } from "./types";

function event(matchId: string, startTime: string): EsportsEvent {
  return {
    matchId,
    startTime,
    state: "unstarted",
    blockName: null,
    bestOf: 3,
    league: { id: null, slug: "lec", name: "LEC", image: null },
    tournamentId: null,
    teams: [],
    hasVod: false,
    streams: [],
  };
}

const NOW = new Date("2026-08-15T12:00:00Z");

describe("groupByDay", () => {
  it("groups into calendar days and orders both days and matches", () => {
    const groups = groupByDay(
      [
        event("b", "2026-08-15T20:00:00Z"),
        event("c", "2026-08-16T09:00:00Z"),
        event("a", "2026-08-15T14:00:00Z"),
      ],
      { zone: "utc", now: NOW }
    );

    expect(groups.map((g) => g.key)).toEqual(["2026-08-15", "2026-08-16"]);
    expect(groups[0].events.map((e) => e.matchId)).toEqual(["a", "b"]);
  });

  it("labels the days around now in words", () => {
    const groups = groupByDay(
      [
        event("yesterday", "2026-08-14T20:00:00Z"),
        event("today", "2026-08-15T20:00:00Z"),
        event("tomorrow", "2026-08-16T09:00:00Z"),
        event("later", "2026-08-18T09:00:00Z"),
      ],
      { zone: "utc", now: NOW }
    );

    // "Tue, Aug 18" rather than "Tue 18 Aug": the label now goes through `UI_LOCALE` like every
    // other date in the interface. It used to be formatted en-GB on the server and in the
    // reader's own locale after the client re-groups, so this line was only ever asserting what
    // the machine running the test happened to prefer.
    expect(groups.map((g) => g.label)).toEqual(["Yesterday", "Today", "Tomorrow", "Tue, Aug 18"]);
  });

  it("reverses both days and matches when descending", () => {
    const groups = groupByDay(
      [
        event("a", "2026-08-14T14:00:00Z"),
        event("b", "2026-08-15T09:00:00Z"),
        event("c", "2026-08-15T20:00:00Z"),
      ],
      { zone: "utc", now: NOW, descending: true }
    );

    expect(groups.map((g) => g.key)).toEqual(["2026-08-15", "2026-08-14"]);
    expect(groups[0].events.map((e) => e.matchId)).toEqual(["c", "b"]);
  });

  it("files a match under the reader's own calendar day, not UTC's", () => {
    // 01:30 UTC on the 16th is still the evening of the 15th anywhere west of
    // UTC-2 — grouping in UTC would put it under the wrong heading for them.
    const late = event("late", "2026-08-16T01:30:00Z");
    const utc = groupByDay([late], { zone: "utc", now: NOW });
    const local = groupByDay([late], { zone: "local", now: NOW });

    expect(utc[0].key).toBe("2026-08-16");
    const localDate = new Date(late.startTime);
    const expected = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
    expect(local[0].key).toBe(expected);
  });

  it("skips entries with an unparseable timestamp instead of making a NaN day", () => {
    const groups = groupByDay([event("bad", "not-a-date"), event("ok", "2026-08-15T14:00:00Z")], {
      zone: "utc",
      now: NOW,
    });

    expect(groups).toHaveLength(1);
    expect(groups[0].events.map((e) => e.matchId)).toEqual(["ok"]);
  });
});

describe("withinDays", () => {
  it("keeps everything up to the horizon and drops what is past it", () => {
    const kept = withinDays(
      [
        event("soon", "2026-08-16T12:00:00Z"),
        event("edge", "2026-08-22T11:00:00Z"),
        event("far", "2026-08-30T12:00:00Z"),
      ],
      7,
      NOW
    );

    expect(kept.map((e) => e.matchId)).toEqual(["soon", "edge"]);
  });
});
