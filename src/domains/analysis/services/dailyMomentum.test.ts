import { describe, it, expect } from "vitest";
import { buildDailySeries, mergeSeries, type DailyPoint, type MomentumRow } from "./dailyMomentum";

const row = (day: string, over: Partial<MomentumRow> = {}): MomentumRow => ({
  gameStart: new Date(`2026-07-${day}T14:00:00Z`),
  kills: 5,
  deaths: 2,
  assists: 5,
  csPerMinute: 6,
  visionScore: 20,
  won: true,
  ...over,
});

describe("buildDailySeries", () => {
  it("emits one point per day played, in date order", () => {
    const series = buildDailySeries([row("03"), row("01"), row("01"), row("02")]);

    expect(series.map((p) => p.date)).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"]);
    expect(series[0].games).toBe(2);
  });

  it("leaves days off out of the series instead of plotting them as zero", () => {
    // A gap in the line means "didn't play"; a zero would read as a collapse in performance.
    const series = buildDailySeries([row("01"), row("05")]);

    expect(series.map((p) => p.date)).toEqual(["2026-07-01", "2026-07-05"]);
  });

  it("computes KDA from the day's totals, not the mean of per-game ratios", () => {
    // Per-game ratios would be 20 and 0.5, averaging to 10.25 — a day that never happened.
    const series = buildDailySeries([
      row("01", { kills: 10, deaths: 1, assists: 10 }),
      row("01", { kills: 1, deaths: 10, assists: 4 }),
    ]);

    // (11 + 14) / 11
    expect(series[0].kda).toBe(2.27);
  });

  it("never divides by zero on a deathless day", () => {
    const series = buildDailySeries([row("01", { kills: 4, deaths: 0, assists: 6 })]);

    expect(series[0].kda).toBe(10);
  });

  it("averages cs per minute and vision across the day's games", () => {
    const series = buildDailySeries([
      row("01", { csPerMinute: 5, visionScore: 10 }),
      row("01", { csPerMinute: 8, visionScore: 21 }),
    ]);

    expect(series[0].csPerMin).toBe(6.5);
    expect(series[0].visionScore).toBe(16);
  });

  it("reports the day's win rate", () => {
    const series = buildDailySeries([
      row("01", { won: true }),
      row("01", { won: true }),
      row("01", { won: false }),
      row("01", { won: false }),
    ]);

    expect(series[0].wins).toBe(2);
    expect(series[0].winRate).toBe(50);
  });

  it("returns an empty series for a player with no matches", () => {
    expect(buildDailySeries([])).toEqual([]);
  });
});

const point = (date: string, kda: number): DailyPoint => ({
  date,
  games: 1,
  wins: 1,
  winRate: 100,
  kda,
  csPerMin: 6,
  visionScore: 20,
});

describe("mergeSeries", () => {
  it("puts both players on one date axis, in order", () => {
    const merged = mergeSeries(
      [point("2026-07-03", 3), point("2026-07-01", 1)],
      [point("2026-07-02", 2)],
      "kda",
    );

    expect(merged.map((p) => p.date)).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"]);
  });

  it("marks a day someone didn't play as null, not zero", () => {
    // Zero would draw a drop to the floor; null lets the chart bridge the gap.
    const merged = mergeSeries([point("2026-07-01", 4)], [point("2026-07-02", 5)], "kda");

    expect(merged).toEqual([
      { date: "2026-07-01", self: 4, duo: null },
      { date: "2026-07-02", self: null, duo: 5 },
    ]);
  });

  it("reads the requested metric", () => {
    const merged = mergeSeries([point("2026-07-01", 4)], [], "winRate");

    expect(merged[0].self).toBe(100);
  });

  it("handles having no duo at all", () => {
    const merged = mergeSeries([point("2026-07-01", 4)], [], "kda");

    expect(merged).toEqual([{ date: "2026-07-01", self: 4, duo: null }]);
  });
});
