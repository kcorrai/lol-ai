import { describe, it, expect } from "vitest";
import { fromDateInput, toDateInput } from "./archiveDates";

describe("fromDateInput", () => {
  it("starts a range at the first millisecond of the chosen day", () => {
    const iso = fromDateInput("2026-08-19", "start");
    const date = new Date(iso as string);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
    expect(date.getDate()).toBe(19);
  });

  // The API compares `gameStart <= to`, so a `to` of midnight would exclude every game played on
  // the day the player picked — the one day they most obviously meant to include.
  it("ends a range at the last millisecond of the chosen day", () => {
    const date = new Date(fromDateInput("2026-08-19", "end") as string);
    expect(date.getHours()).toBe(23);
    expect(date.getMinutes()).toBe(59);
    expect(date.getSeconds()).toBe(59);
    expect(date.getMilliseconds()).toBe(999);
    expect(date.getDate()).toBe(19);
  });

  it("keeps a game played late on the end day inside the range", () => {
    const to = new Date(fromDateInput("2026-08-19", "end") as string);
    const lateGame = new Date(2026, 7, 19, 22, 30);
    expect(lateGame.getTime()).toBeLessThanOrEqual(to.getTime());
  });

  it("returns undefined for a cleared or malformed input", () => {
    expect(fromDateInput("", "start")).toBeUndefined();
    expect(fromDateInput("not-a-date", "end")).toBeUndefined();
  });

  it("emits an ISO string with an offset, which the schema requires", () => {
    expect(fromDateInput("2026-08-19", "start")).toMatch(/Z$/);
  });
});

describe("toDateInput", () => {
  it("round-trips a day through the input's format in local time", () => {
    const iso = fromDateInput("2026-08-19", "end") as string;
    expect(toDateInput(iso)).toBe("2026-08-19");
  });

  it("is empty for an absent or unparseable value", () => {
    expect(toDateInput(undefined)).toBe("");
    expect(toDateInput("nonsense")).toBe("");
  });
});
