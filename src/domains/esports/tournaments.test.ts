import { describe, expect, it } from "vitest";
import {
  daysBetween,
  formatTournamentDates,
  groupTournaments,
  relativeTiming,
  tournamentChampion,
  tournamentName,
  tournamentProgress,
  tournamentState,
} from "@/domains/esports/tournaments";
import type {
  BracketMatch,
  EsportsLeague,
  EsportsTournament,
  StandingsStage,
} from "@/domains/esports/types";

const LCS: EsportsLeague = {
  id: "l1",
  slug: "lcs",
  name: "LCS",
  region: "NORTH AMERICA",
  image: null,
  displayStatus: "selected",
  displayPosition: 0,
};

function split(slug: string, startDate: string | null, endDate: string | null): EsportsTournament {
  return { id: slug, slug, startDate, endDate, leagueId: "l1" };
}

function match(id: string, a: [string, number], b: [string, number]): BracketMatch {
  const team = ([name, wins]: [string, number], other: number) => ({
    id: name,
    slug: null,
    name,
    code: name,
    image: null,
    decided: true,
    gameWins: wins,
    outcome: wins > other ? ("win" as const) : ("loss" as const),
  });
  return {
    matchId: id,
    state: "completed",
    previousMatchIds: [],
    teams: [team(a, b[1]), team(b, a[1])],
  };
}

function bracket(stageName: string, matches: BracketMatch[]): StandingsStage {
  return { kind: "bracket", stageName, sectionName: stageName, matches };
}

describe("tournamentName", () => {
  it("keeps the league's own spelling instead of title-casing its acronym", () => {
    expect(tournamentName(split("lcs_split_3_2026", null, null), LCS)).toBe("LCS Split 3 2026");
  });

  it("uses the league's name when the slug is the league", () => {
    expect(tournamentName(split("lcs", null, null), LCS)).toBe("LCS");
  });

  it("title-cases a slug that does not start with the league", () => {
    expect(tournamentName(split("worlds_2026", null, null), LCS)).toBe("Worlds 2026");
  });
});

describe("tournamentState", () => {
  const t = split("s", "2026-07-25", "2026-10-05");

  it("reads upcoming before the first day, running through the last, ended after", () => {
    expect(tournamentState(t, "2026-07-24")).toBe("upcoming");
    expect(tournamentState(t, "2026-07-25")).toBe("running");
    expect(tournamentState(t, "2026-10-05")).toBe("running");
    expect(tournamentState(t, "2026-10-06")).toBe("ended");
  });
});

describe("formatTournamentDates", () => {
  it("says the year once when both ends share it", () => {
    expect(formatTournamentDates(split("s", "2026-07-23", "2026-09-20"))).toBe(
      "23 Jul – 20 Sep 2026"
    );
  });

  it("says both years across a new year", () => {
    expect(formatTournamentDates(split("s", "2025-12-30", "2026-01-04"))).toBe(
      "30 Dec 2025 – 4 Jan 2026"
    );
  });

  it("copes with a missing bound", () => {
    expect(formatTournamentDates(split("s", "2026-10-20", null))).toBe("From 20 Oct 2026");
    expect(formatTournamentDates(split("s", null, null))).toBe("");
  });
});

describe("relativeTiming", () => {
  it("counts down to a start and to an end, and back from a finish", () => {
    expect(relativeTiming(split("s", "2026-10-20", "2026-11-20"), "2026-09-27")).toBe(
      "Starts in 23 days"
    );
    expect(relativeTiming(split("s", "2026-09-28", "2026-10-13"), "2026-09-27")).toBe(
      "Starts tomorrow"
    );
    expect(relativeTiming(split("s", "2026-07-25", "2026-10-05"), "2026-09-27")).toBe(
      "Ends in 8 days"
    );
    expect(relativeTiming(split("s", "2026-07-23", "2026-09-20"), "2026-09-27")).toBe(
      "Ended 7 days ago"
    );
    expect(relativeTiming(split("s", "2026-07-23", "2026-09-26"), "2026-09-27")).toBe(
      "Ended yesterday"
    );
  });
});

describe("tournamentProgress", () => {
  it("counts the day of the split, first and last day inclusive", () => {
    expect(tournamentProgress(split("s", "2026-09-19", "2026-10-02"), "2026-09-27")).toEqual({
      day: 9,
      of: 14,
    });
  });

  it("is null without both bounds", () => {
    expect(tournamentProgress(split("s", "2026-09-19", null), "2026-09-27")).toBeNull();
  });
});

describe("daysBetween", () => {
  it("is signed", () => {
    expect(daysBetween("2026-09-27", "2026-10-05")).toBe(8);
    expect(daysBetween("2026-10-05", "2026-09-27")).toBe(-8);
  });
});

describe("groupTournaments", () => {
  it("orders each group the way its question is asked", () => {
    const entries = [
      split("worlds", "2026-10-20", "2026-11-20"),
      split("promo", "2026-10-05", "2026-10-13"),
      split("lcs3", "2026-07-25", "2026-10-05"),
      split("wsci", "2026-09-19", "2026-10-02"),
      split("lec3", "2026-07-23", "2026-09-20"),
      split("msi", "2026-06-27", "2026-07-12"),
    ].map((tournament) => ({ tournament }));

    const groups = groupTournaments(entries, "2026-09-27");
    const slugs = (list: { tournament: EsportsTournament }[]): string[] =>
      list.map((entry) => entry.tournament.slug);

    expect(slugs(groups.running)).toEqual(["wsci", "lcs3"]);
    expect(slugs(groups.upcoming)).toEqual(["promo", "worlds"]);
    expect(slugs(groups.finished)).toEqual(["lec3", "msi"]);
  });
});

describe("tournamentChampion", () => {
  it("names the winner of the last match in the deciding stage", () => {
    const champion = tournamentChampion([
      { kind: "table", stageName: "Regular Season", sectionName: "Regular Season", rows: [] },
      bracket("Playoffs", [match("m1", ["KC", 3], ["GX", 1]), match("m2", ["G2", 3], ["MKOI", 0])]),
    ]);

    expect(champion).toMatchObject({
      winner: { name: "G2" },
      runnerUp: { name: "MKOI" },
      score: "3–0",
      matchId: "m2",
      stageName: "Playoffs",
    });
  });

  it("skips a qualifier played after the title was decided", () => {
    // LPL Split 3 2026: the Playoffs final decides the split, and a Regional
    // Qualifier for Worlds is published after it.
    const champion = tournamentChampion([
      bracket("Playoffs Play-in: Knights Rivals", [match("p1", ["TES", 3], ["NIP", 2])]),
      bracket("Playoffs", [match("f", ["AL", 3], ["BLG", 1])]),
      bracket("Regional Qualifier", [match("q", ["IG", 3], ["JDG", 1])]),
    ]);

    expect(champion?.winner.name).toBe("AL");
  });

  it("is null when nothing in the deciding stage has been decided", () => {
    const undecided = match("m", ["A", 0], ["B", 0]);
    undecided.teams.forEach((team) => (team.outcome = null));
    expect(tournamentChampion([bracket("Playoffs", [undecided])])).toBeNull();
    expect(tournamentChampion([])).toBeNull();
  });
});
