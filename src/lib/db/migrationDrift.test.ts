import { describe, expect, it } from "vitest";
import { compareMigrations, isInSync } from "@/lib/db/migrationDrift";

const A = "20260101000000_first";
const B = "20260102000000_second";
const C = "20260103000000_third";

describe("compareMigrations", () => {
  it("reports nothing when the checkout and the database agree", () => {
    const drift = compareMigrations([A, B], [A, B]);
    expect(drift).toEqual({ missing: [], unknown: [] });
    expect(isInSync(drift)).toBe(true);
  });

  it("lists what the database has not applied yet", () => {
    const drift = compareMigrations([A, B, C], [A]);
    expect(drift.missing).toEqual([B, C]);
    expect(drift.unknown).toEqual([]);
    expect(isInSync(drift)).toBe(false);
  });

  // The signal that matters for LA-65: a database holding migrations this checkout has never
  // heard of is a different database, not an out-of-date one.
  it("lists what the database holds that the checkout does not", () => {
    const drift = compareMigrations([A], [A, B, C]);
    expect(drift.missing).toEqual([]);
    expect(drift.unknown).toEqual([B, C]);
    expect(isInSync(drift)).toBe(false);
  });

  it("reports both directions at once when the two have genuinely diverged", () => {
    const drift = compareMigrations([A, B], [A, C]);
    expect(drift).toEqual({ missing: [B], unknown: [C] });
  });

  it("sorts by name so the output is stable whatever order the rows came back in", () => {
    const drift = compareMigrations([C, A, B], [A]);
    expect(drift.missing).toEqual([B, C]);
  });

  it("treats an empty database as missing everything rather than as in sync", () => {
    const drift = compareMigrations([A, B], []);
    expect(drift.missing).toEqual([A, B]);
    expect(isInSync(drift)).toBe(false);
  });

  it("is in sync when neither side has any migrations at all", () => {
    expect(isInSync(compareMigrations([], []))).toBe(true);
  });
});
