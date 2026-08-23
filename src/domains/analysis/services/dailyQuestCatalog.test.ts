import { describe, expect, it } from "vitest";
import {
  ON_SITE_TASKS,
  dayNumber,
  dayWindow,
  pickOnSiteTask,
  questDateKey,
  shiftDateKey,
} from "./dailyQuestCatalog";

const USER = "8f1c1b2e-0000-4000-8000-000000000001";
const OTHER = "8f1c1b2e-0000-4000-8000-000000000002";

describe("questDateKey", () => {
  it("uses the UTC calendar day, not the local one", () => {
    expect(questDateKey(new Date("2026-08-18T23:30:00Z"))).toBe("2026-08-18");
    expect(questDateKey(new Date("2026-08-19T00:00:00Z"))).toBe("2026-08-19");
  });
});

describe("shiftDateKey", () => {
  it("walks backwards across a month boundary", () => {
    expect(shiftDateKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("walks backwards across a leap day", () => {
    expect(shiftDateKey("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("walks forwards across a year boundary", () => {
    expect(shiftDateKey("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("dayWindow", () => {
  it("opens at midnight UTC and closes exactly one day later", () => {
    const { start, end } = dayWindow("2026-08-18");
    expect(start.toISOString()).toBe("2026-08-18T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });
});

describe("pickOnSiteTask", () => {
  it("gives the same player the same task all day", () => {
    expect(pickOnSiteTask(USER, "2026-08-18")).toBe(pickOnSiteTask(USER, "2026-08-18"));
  });

  it("changes the task the next day", () => {
    expect(pickOnSiteTask(USER, "2026-08-18").id).not.toBe(pickOnSiteTask(USER, "2026-08-19").id);
  });

  it("does not hand every player the same task on the same day", () => {
    const ids = new Set(
      Array.from({ length: 40 }, (_, i) => pickOnSiteTask(`${OTHER}${i}`, "2026-08-18").id)
    );
    expect(ids.size).toBeGreaterThan(1);
  });

  it("issues every task once before repeating any", () => {
    const seen = new Set<string>();
    for (let i = 0; i < ON_SITE_TASKS.length; i++) {
      seen.add(pickOnSiteTask(USER, shiftDateKey("2026-08-18", i)).id);
    }
    expect(seen.size).toBe(ON_SITE_TASKS.length);
  });

  it("stays in the catalogue for a year of days", () => {
    const ids = new Set(ON_SITE_TASKS.map((t) => t.id));
    for (let i = 0; i < 365; i++) {
      expect(ids.has(pickOnSiteTask(USER, shiftDateKey("2026-01-01", i)).id)).toBe(true);
    }
  });
});

describe("dayNumber", () => {
  it("counts whole days between keys", () => {
    expect(dayNumber("2026-08-19") - dayNumber("2026-08-18")).toBe(1);
  });
});
