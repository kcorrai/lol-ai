import { describe, expect, it } from "vitest";
import { headToHead } from "@/domains/esports/headToHead";
import type { EsportsEvent, EsportsEventTeam, MatchOutcome } from "@/domains/esports/types";

function team(
  name: string,
  code: string,
  gameWins: number,
  outcome: MatchOutcome | null
): EsportsEventTeam {
  return { id: null, slug: null, name, code, image: null, gameWins, outcome, record: null };
}

interface EventSpec {
  matchId: string;
  startTime: string;
  teams: EsportsEventTeam[];
  state?: EsportsEvent["state"];
}

function event(spec: EventSpec): EsportsEvent {
  return {
    matchId: spec.matchId,
    startTime: spec.startTime,
    state: spec.state ?? "completed",
    blockName: "Week 4",
    bestOf: 3,
    league: { id: "l-1", slug: "lec", name: "LEC", image: null },
    tournamentId: null,
    teams: spec.teams,
    hasVod: false,
    streams: [],
  };
}

const G2 = { name: "G2 Esports", code: "G2" };
const FNC = { name: "Fnatic", code: "FNC" };

describe("headToHead", () => {
  it("counts series and games across every meeting", () => {
    const record = headToHead(
      [
        event({
          matchId: "m-1",
          startTime: "2026-07-01T18:00:00Z",
          teams: [team("G2 Esports", "G2", 2, "win"), team("Fnatic", "FNC", 1, "loss")],
        }),
        event({
          matchId: "m-2",
          startTime: "2026-08-01T18:00:00Z",
          teams: [team("Fnatic", "FNC", 2, "win"), team("G2 Esports", "G2", 0, "loss")],
        }),
      ],
      G2,
      FNC
    );

    expect(record.seriesWins).toEqual({ a: 1, b: 1 });
    // 2-1 then 0-2, always read from the first team's side whichever way the
    // feed happened to order the event's own team list.
    expect(record.gameWins).toEqual({ a: 2, b: 3 });
  });

  it("puts the most recent meeting first, whatever order the window is in", () => {
    const record = headToHead(
      [
        event({
          matchId: "old",
          startTime: "2026-07-01T18:00:00Z",
          teams: [team("G2 Esports", "G2", 2, "win"), team("Fnatic", "FNC", 1, "loss")],
        }),
        event({
          matchId: "new",
          startTime: "2026-08-01T18:00:00Z",
          teams: [team("G2 Esports", "G2", 2, "win"), team("Fnatic", "FNC", 0, "loss")],
        }),
      ],
      G2,
      FNC
    );

    expect(record.meetings.map((meeting) => meeting.matchId)).toEqual(["new", "old"]);
  });

  it("leaves out the match being read about", () => {
    const record = headToHead(
      [
        event({
          matchId: "this-one",
          startTime: "2026-08-01T18:00:00Z",
          teams: [team("G2 Esports", "G2", 2, "win"), team("Fnatic", "FNC", 1, "loss")],
        }),
      ],
      G2,
      FNC,
      { excludeMatchId: "this-one" }
    );

    // Its scoreline is already at the top of the page; repeating it as "these
    // two have met once" with a link back to itself is noise.
    expect(record.meetings).toEqual([]);
  });

  it("ignores matches that have not finished", () => {
    const record = headToHead(
      [
        event({
          matchId: "m-1",
          state: "unstarted",
          startTime: "2026-09-01T18:00:00Z",
          teams: [team("G2 Esports", "G2", 0, null), team("Fnatic", "FNC", 0, null)],
        }),
      ],
      G2,
      FNC
    );

    expect(record.meetings).toEqual([]);
  });

  it("ignores a match only one of the two played", () => {
    const record = headToHead(
      [
        event({
          matchId: "m-1",
          startTime: "2026-08-01T18:00:00Z",
          teams: [team("G2 Esports", "G2", 2, "win"), team("MAD Lions", "MAD", 1, "loss")],
        }),
      ],
      G2,
      FNC
    );

    expect(record.meetings).toEqual([]);
  });

  it("matches on name when the codes differ", () => {
    const record = headToHead(
      [
        event({
          matchId: "m-1",
          startTime: "2026-08-01T18:00:00Z",
          teams: [team("G2 Esports", "G2W", 2, "win"), team("Fnatic", "FNC", 1, "loss")],
        }),
      ],
      G2,
      FNC
    );

    expect(record.meetings).toHaveLength(1);
  });

  it("never matches one entry against itself", () => {
    // Both arguments naming the same team would otherwise report a side as
    // having beaten itself in every game it played.
    const record = headToHead(
      [
        event({
          matchId: "m-1",
          startTime: "2026-08-01T18:00:00Z",
          teams: [team("G2 Esports", "G2", 2, "win"), team("Fnatic", "FNC", 1, "loss")],
        }),
      ],
      G2,
      G2
    );

    expect(record.meetings).toEqual([]);
  });

  it("records a meeting the feed published no outcome for without crediting a win", () => {
    const record = headToHead(
      [
        event({
          matchId: "m-1",
          startTime: "2026-08-01T18:00:00Z",
          teams: [team("G2 Esports", "G2", 1, null), team("Fnatic", "FNC", 1, null)],
        }),
      ],
      G2,
      FNC
    );

    expect(record.meetings[0].winner).toBeNull();
    expect(record.seriesWins).toEqual({ a: 0, b: 0 });
    // The games still happened, whatever the feed says about the series.
    expect(record.gameWins).toEqual({ a: 1, b: 1 });
  });

  it("has an empty record when the two have never met in the window", () => {
    expect(headToHead([], G2, FNC)).toEqual({
      meetings: [],
      seriesWins: { a: 0, b: 0 },
      gameWins: { a: 0, b: 0 },
    });
  });
});
