import { describe, expect, it, vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(), isTauri: () => false }));

import {
  archiveUrl,
  firstRow,
  isNewMatch,
  matchLength,
  scoreline,
  type ArchiveRow,
} from "./lastMatch";

const row = (over: Partial<ArchiveRow> = {}): ArchiveRow =>
  ({
    participantId: "p",
    matchDbId: "m",
    riotMatchId: "EUW1_1",
    gameStart: "2026-08-26T10:00:00.000Z",
    gameDurationSeconds: 1830,
    queueType: "RANKED_SOLO_5x5",
    gameVersion: "16.16.1",
    championName: "Annie",
    championId: 1,
    position: "MIDDLE",
    won: true,
    kills: 7,
    deaths: 2,
    assists: 9,
    kda: 8,
    cs: 214,
    csPerMinute: 7.01,
    visionScore: 21,
    goldEarned: 12345,
    damageDealt: 22222,
    itemIds: [],
    ...over,
  }) as ArchiveRow;

describe("archiveUrl", () => {
  it("asks for one row, because only the top one can be the new match", () => {
    expect(archiveUrl("abc")).toBe("/api/match/archive?riotAccountId=abc&limit=1");
  });

  it("escapes the id rather than pasting it into a query string", () => {
    expect(archiveUrl("a&limit=500")).toContain("riotAccountId=a%26limit%3D500");
  });
});

describe("firstRow", () => {
  it("reads the row out of the website's envelope", () => {
    expect(firstRow({ data: { rows: [row()] } })?.riotMatchId).toBe("EUW1_1");
  });

  it("is nothing when the archive is empty", () => {
    expect(firstRow({ data: { rows: [] } })).toBeNull();
  });

  /**
   * This is the one shape the app reads without a Rust struct mirroring it, so a shape that
   * is not what was expected has to be an empty panel rather than a throw inside a timer.
   */
  it("is nothing rather than a throw for anything unexpected", () => {
    for (const body of [
      null,
      undefined,
      42,
      "rows",
      {},
      { data: null },
      { data: {} },
      { data: { rows: "no" } },
    ]) {
      expect(firstRow(body)).toBeNull();
    }
  });

  it("refuses a row with no match id, which is the one field it identifies by", () => {
    expect(firstRow({ data: { rows: [{ championName: "Annie" }] } })).toBeNull();
  });
});

describe("isNewMatch", () => {
  /** The archive has no "this one is new" field, so it is told by what was there before. */
  it("is the new game when the top row has changed", () => {
    expect(isNewMatch("EUW1_1", row({ riotMatchId: "EUW1_2" }))).toBe(true);
  });

  it("is not the new game while the top row is the one from before", () => {
    expect(isNewMatch("EUW1_1", row({ riotMatchId: "EUW1_1" }))).toBe(false);
  });

  /** An account with no matches at all has no top row, so any row is the new one. */
  it("counts the first match an account has ever had", () => {
    expect(isNewMatch(null, row())).toBe(true);
  });

  it("is nothing to wait on when there is no row", () => {
    expect(isNewMatch("EUW1_1", null)).toBe(false);
  });
});

describe("the figures a finished game is drawn with", () => {
  it("reads a scoreline the way a scoreboard does", () => {
    expect(scoreline(row())).toBe("7/2/9");
  });

  it("reads a length in minutes", () => {
    expect(matchLength(1830)).toBe("30:30");
    expect(matchLength(59)).toBe("0:59");
  });

  it("never draws a negative length", () => {
    expect(matchLength(-1)).toBe("0:00");
  });
});
