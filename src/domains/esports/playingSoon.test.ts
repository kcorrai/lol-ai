import { describe, it, expect } from "vitest";
import { teamsPlayingSoon } from "./playingSoon";
import type { EsportsEvent, EsportsTeam } from "@/domains/esports/types";

const NOW = new Date("2026-08-18T12:00:00Z");

function team(over: Partial<EsportsTeam> & { id: string; code: string }): EsportsTeam {
  return {
    slug: over.code.toLowerCase(),
    name: over.code,
    image: null,
    backgroundImage: null,
    status: "active",
    league: null,
    players: [],
    ...over,
  };
}

function event(
  over: Partial<EsportsEvent> & { matchId: string; startTime: string; codes: [string, string] }
): EsportsEvent {
  const { codes, ...rest } = over;
  return {
    state: "unstarted",
    blockName: null,
    bestOf: 3,
    league: { id: null, slug: "lck", name: "LCK", image: null },
    tournamentId: null,
    hasVod: false,
    streams: [],
    teams: codes.map((code) => ({
      id: null,
      slug: null,
      name: code,
      code,
      image: null,
      gameWins: 0,
      outcome: null,
      record: null,
    })),
    ...rest,
  };
}

const OPTIONS = { withinHours: 24, now: NOW, limit: 6 };

describe("teamsPlayingSoon", () => {
  it("matches fixture teams back to the index by code", () => {
    const teams = [team({ id: "1", code: "T1" }), team({ id: "2", code: "GEN" })];
    const events = [
      event({ matchId: "m1", startTime: "2026-08-18T14:00:00Z", codes: ["T1", "GEN"] }),
    ];

    expect(teamsPlayingSoon(teams, events, OPTIONS).map((entry) => entry.team.id)).toEqual([
      "1",
      "2",
    ]);
  });

  it("drops a code two teams share rather than guessing which one is playing", () => {
    const teams = [
      team({ id: "1", code: "TL", name: "Team Liquid" }),
      team({ id: "2", code: "TL", name: "Twisted Lemons" }),
      team({ id: "3", code: "C9" }),
    ];
    const events = [
      event({ matchId: "m1", startTime: "2026-08-18T14:00:00Z", codes: ["TL", "C9"] }),
    ];

    expect(teamsPlayingSoon(teams, events, OPTIONS).map((entry) => entry.team.id)).toEqual(["3"]);
  });

  it("prefers the id when the fixture carries one", () => {
    const teams = [team({ id: "1", code: "TL" }), team({ id: "2", code: "TL" })];
    const fixture = event({
      matchId: "m1",
      startTime: "2026-08-18T14:00:00Z",
      codes: ["TL", "XX"],
    });
    fixture.teams[0].id = "2";

    expect(teamsPlayingSoon(teams, [fixture], OPTIONS).map((entry) => entry.team.id)).toEqual([
      "2",
    ]);
  });

  it("ignores a fixture beyond the window", () => {
    const teams = [team({ id: "1", code: "T1" })];
    const events = [
      event({ matchId: "m1", startTime: "2026-08-21T14:00:00Z", codes: ["T1", "GEN"] }),
    ];

    expect(teamsPlayingSoon(teams, events, OPTIONS)).toEqual([]);
  });

  it("ignores a kickoff that has passed unless the series is still live", () => {
    const teams = [team({ id: "1", code: "T1" }), team({ id: "2", code: "GEN" })];
    const stale = event({ matchId: "m1", startTime: "2026-08-18T09:00:00Z", codes: ["T1", "XX"] });
    const live = event({
      matchId: "m2",
      startTime: "2026-08-18T10:00:00Z",
      codes: ["GEN", "XX"],
      state: "inProgress",
    });

    expect(teamsPlayingSoon(teams, [stale, live], OPTIONS).map((entry) => entry.team.id)).toEqual([
      "2",
    ]);
  });

  it("lists a team once, and puts a live series ahead of a later kickoff", () => {
    const teams = [team({ id: "1", code: "T1" }), team({ id: "2", code: "GEN" })];
    const events = [
      event({ matchId: "m1", startTime: "2026-08-18T13:00:00Z", codes: ["T1", "XX"] }),
      event({ matchId: "m2", startTime: "2026-08-18T18:00:00Z", codes: ["T1", "GEN"] }),
      event({
        matchId: "m3",
        startTime: "2026-08-18T11:30:00Z",
        codes: ["GEN", "XX"],
        state: "inProgress",
      }),
    ];

    const found = teamsPlayingSoon(teams, events, OPTIONS);
    expect(found.map((entry) => entry.team.id)).toEqual(["2", "1"]);
    expect(found[0].live).toBe(true);
    expect(found[1].startTime).toBe("2026-08-18T13:00:00Z");
  });
});
