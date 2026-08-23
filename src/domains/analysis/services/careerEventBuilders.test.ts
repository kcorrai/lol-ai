import { describe, expect, it } from "vitest";
import { buildChampionEras, buildRecords } from "./careerEventBuilders";
import type { CareerMatchRow } from "./careerTimeline.types";

interface RowOverrides {
  won?: boolean;
  kills?: number;
  deaths?: number;
  assists?: number;
  csPerMinute?: number;
  visionScore?: number;
}

function row(
  gameStart: string,
  championName: string,
  overrides: RowOverrides = {}
): CareerMatchRow {
  return {
    matchId: `TR1_${gameStart}_${championName}`,
    championId: 1,
    championName,
    kills: overrides.kills ?? 4,
    deaths: overrides.deaths ?? 4,
    assists: overrides.assists ?? 4,
    cs: 150,
    csPerMinute: overrides.csPerMinute ?? 5,
    visionScore: overrides.visionScore ?? 20,
    won: overrides.won ?? false,
    gameStart: new Date(gameStart),
    gameDuration: 1800,
  };
}

/** `count` games of one champion inside one month, one per day from the 1st. */
function month(
  monthKey: string,
  championName: string,
  count: number,
  won = false
): CareerMatchRow[] {
  return Array.from({ length: count }, (_, i) =>
    row(`${monthKey}-${String(i + 1).padStart(2, "0")}T12:00:00Z`, championName, { won })
  );
}

describe("buildChampionEras", () => {
  it("names the champion a run of months belonged to", () => {
    const eras = buildChampionEras([
      ...month("2026-06", "Yasuo", 8),
      ...month("2026-07", "Yasuo", 8),
    ]);

    expect(eras).toHaveLength(1);
    expect(eras[0].title).toBe("Your Yasuo era began");
    // Dated to the first game of the era, not the month boundary.
    expect(eras[0].at).toBe("2026-06-01T12:00:00.000Z");
  });

  it("counts the whole era, not just its first month", () => {
    const eras = buildChampionEras([
      ...month("2026-06", "Yasuo", 6, true),
      ...month("2026-07", "Yasuo", 4, false),
    ]);
    expect(eras[0].detail).toBe("10 games · 60% win rate");
  });

  it("starts a new era when the most-played champion changes", () => {
    const eras = buildChampionEras([
      ...month("2026-06", "Yasuo", 8),
      ...month("2026-07", "Zed", 8),
    ]);
    expect(eras.map((e) => e.title)).toEqual(["Your Yasuo era began", "Your Zed era began"]);
  });

  it("ignores a champion tried for a couple of games", () => {
    // Ahri tops a month, but on too few games to call it an era.
    expect(buildChampionEras(month("2026-06", "Ahri", 3))).toEqual([]);
  });

  it("resumes an era as a new one after an interruption", () => {
    const eras = buildChampionEras([
      ...month("2026-05", "Yasuo", 6),
      ...month("2026-06", "Zed", 6),
      ...month("2026-07", "Yasuo", 6),
    ]);
    expect(eras).toHaveLength(3);
    expect(eras.map((e) => e.id)).toEqual([
      "era:Yasuo:2026-05",
      "era:Zed:2026-06",
      "era:Yasuo:2026-07",
    ]);
  });

  it("has nothing to say about an empty history", () => {
    expect(buildChampionEras([])).toEqual([]);
  });
});

describe("buildRecords", () => {
  const filler = month("2026-06", "Ahri", 6);

  it("says nothing until there is enough history to have a best", () => {
    expect(buildRecords(month("2026-06", "Ahri", 4))).toEqual([]);
  });

  it("pins the standing record to the game that set it", () => {
    const best = row("2026-06-20T12:00:00Z", "Yasuo", { kills: 12, deaths: 2, assists: 9 });
    const records = buildRecords([...filler, best]);
    const kdaRecord = records.find((r) => r.id.startsWith("record:kda"));

    expect(kdaRecord?.at).toBe("2026-06-20T12:00:00.000Z");
    expect(kdaRecord?.detail).toBe("12/2/9 on Yasuo · 10.5 KDA");
    expect(kdaRecord?.href).toBe("/match/TR1_2026-06-20T12:00:00Z_Yasuo");
  });

  it("emits one event per record rather than one every time a record moved", () => {
    const climbing = [
      row("2026-06-10T12:00:00Z", "Ahri", { kills: 6 }),
      row("2026-06-11T12:00:00Z", "Ahri", { kills: 9 }),
      row("2026-06-12T12:00:00Z", "Ahri", { kills: 14 }),
    ];
    const records = buildRecords([...filler, ...climbing]);
    const killRecords = records.filter((r) => r.id.startsWith("record:kills"));

    expect(killRecords).toHaveLength(1);
    expect(killRecords[0].detail).toBe("14 kills on Ahri");
  });

  it("keeps the earlier game when a record is tied", () => {
    const tied = [
      row("2026-06-10T12:00:00Z", "First", { visionScore: 80 }),
      row("2026-06-11T12:00:00Z", "Second", { visionScore: 80 }),
    ];
    const vision = buildRecords([...filler, ...tied]).find((r) => r.id.startsWith("record:vision"));
    expect(vision?.detail).toBe("80 vision score on First");
  });

  it("finds the longest win streak and dates it to the win that made it", () => {
    const streak = [
      row("2026-07-01T12:00:00Z", "Ahri", { won: true }),
      row("2026-07-02T12:00:00Z", "Ahri", { won: true }),
      row("2026-07-03T12:00:00Z", "Ahri", { won: true }),
      row("2026-07-04T12:00:00Z", "Ahri", { won: true }),
      row("2026-07-05T12:00:00Z", "Ahri", { won: false }),
    ];
    const record = buildRecords([...filler, ...streak]).find((r) =>
      r.id.startsWith("record:streak")
    );

    expect(record?.title).toBe("4-game win streak");
    expect(record?.at).toBe("2026-07-04T12:00:00.000Z");
  });

  it("does not call two wins a streak", () => {
    const shortRun = [
      row("2026-07-01T12:00:00Z", "Ahri", { won: true }),
      row("2026-07-02T12:00:00Z", "Ahri", { won: true }),
      row("2026-07-03T12:00:00Z", "Ahri", { won: false }),
    ];
    const record = buildRecords([...filler, ...shortRun]).find((r) =>
      r.id.startsWith("record:streak")
    );
    expect(record).toBeUndefined();
  });

  it("does not read the rows it was handed in whatever order they arrived", () => {
    const shuffled = [
      row("2026-07-03T12:00:00Z", "Ahri", { won: true }),
      row("2026-07-01T12:00:00Z", "Ahri", { won: true }),
      row("2026-07-02T12:00:00Z", "Ahri", { won: true }),
      ...filler,
    ];
    const record = buildRecords(shuffled).find((r) => r.id.startsWith("record:streak"));
    expect(record?.title).toBe("3-game win streak");
  });
});
