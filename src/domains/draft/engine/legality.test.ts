import { describe, expect, it } from "vitest";
import { makeSeries, play, started } from "@/test/draftFixtures";
import { canSelect, championsUsedInGame, unavailableReason } from "./legality";
import type { DraftSeriesState } from "./draft.types";

function expectDenied(result: ReturnType<typeof canSelect>, reason: string): void {
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.reason).toBe(reason);
}

describe("legality", () => {
  it("refuses to act before both sides are ready", () => {
    expectDenied(canSelect(makeSeries(), 1, "BLUE", "Ahri"), "draft-not-running");
  });

  it("refuses to act out of turn", () => {
    const series = started(makeSeries());
    expectDenied(canSelect(series, 1, "RED", "Ahri"), "not-your-turn");
    expect(canSelect(series, 1, "BLUE", "Ahri").ok).toBe(true);
  });

  it("refuses to act once the draft is finished", () => {
    const series = started(makeSeries());
    const done = play(series, [
      "Aatrox",
      "Ahri",
      "Akali",
      "Alistar",
      "Amumu",
      "Anivia",
      "Annie",
      "Ashe",
      "Azir",
      "Bard",
      "Braum",
      "Caitlyn",
      "Camille",
      "Darius",
      "Diana",
      "Draven",
      "Ekko",
      "Elise",
      "Ezreal",
      "Fiora",
    ]);
    expect(done.games[0].phase).toBe("COMPLETE");
    expectDenied(canSelect(done, 1, "BLUE", "Garen"), "draft-not-running");
  });

  it("rejects a champion already used in this game, whoever used it", () => {
    // Step 0 is a blue ban; step 1 is a red ban.
    const series = play(started(makeSeries()), ["Ahri"]);
    expectDenied(canSelect(series, 1, "RED", "Ahri"), "already-used");
    expectDenied(canSelect(series, 1, "RED", "ahri"), "already-used");
  });

  it("rejects a disabled champion, and does not treat it as banned", () => {
    const series = started(makeSeries({ disabledChampions: ["Yuumi"] }));
    expectDenied(canSelect(series, 1, "BLUE", "Yuumi"), "disabled");
    expect(championsUsedInGame(series.games[0]).has("yuumi")).toBe(false);
  });

  it("rejects a champion the caller has never heard of", () => {
    const series = started(makeSeries());
    const known = new Set(["ahri"]);
    expectDenied(canSelect(series, 1, "BLUE", "NotAChampion", known), "unknown-champion");
    expect(canSelect(series, 1, "BLUE", "Ahri", known).ok).toBe(true);
  });

  it("allows a passed ban but never a passed pick", () => {
    const series = started(makeSeries());
    expect(canSelect(series, 1, "BLUE", null).ok).toBe(true);

    const atFirstPick = play(series, ["Aatrox", "Ahri", "Akali", "Alistar", "Amumu", "Anivia"]);
    expect(atFirstPick.games[0].step).toBe(6);
    expectDenied(canSelect(atFirstPick, 1, "BLUE", null), "unknown-champion");
  });

  it("explains availability without reference to whose turn it is", () => {
    const series = started(makeSeries({ disabledChampions: ["Yuumi"] }));
    expect(unavailableReason(series, 1, "RED", "Ahri")).toBeNull();
    expect(unavailableReason(series, 1, "RED", "Yuumi")).toBe("disabled");
    expect(unavailableReason(series, 1, "RED", "  ")).toBe("unknown-champion");
    expect(unavailableReason(series, 9, "RED", "Ahri")).toBe("draft-not-running");
  });

  it("reports series-locked separately from already-used", () => {
    const series = makeSeries({ mode: "FEARLESS", gameCount: 2 });
    const withHistory: DraftSeriesState = {
      ...series,
      games: series.games.map((g) =>
        g.gameNumber === 1
          ? {
              ...g,
              phase: "COMPLETE" as const,
              step: 20,
              actions: [
                {
                  step: 6,
                  side: "BLUE" as const,
                  kind: "PICK" as const,
                  championKey: "Ahri",
                  timedOut: false,
                },
              ],
            }
          : g
      ),
    };
    expect(unavailableReason(withHistory, 2, "RED", "Ahri")).toBe("series-locked");
  });
});
