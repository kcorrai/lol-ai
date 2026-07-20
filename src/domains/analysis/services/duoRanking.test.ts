import { describe, it, expect } from "vitest";
import { rankTeammates, type OwnMatchRow, type TeammateRow } from "./duoRanking";

const own = (matchId: string, teamId: number, day: number): OwnMatchRow => ({
  matchId,
  teamId,
  gameStart: new Date(`2026-07-${String(day).padStart(2, "0")}T12:00:00Z`),
});

const mate = (
  matchId: string,
  teamId: number,
  puuid: string,
  won = true,
  gameName = "Duo",
  tagLine = "EUW",
): TeammateRow => ({ matchId, teamId, puuid, gameName, tagLine, won });

describe("rankTeammates", () => {
  it("counts only teammates, never opponents", () => {
    const ownRows = [own("m1", 100, 1), own("m2", 100, 2), own("m3", 100, 3)];
    const teammates = [
      mate("m1", 100, "friend"),
      mate("m2", 100, "friend"),
      mate("m3", 100, "friend"),
      // Same person met three times on the enemy side — not a duo.
      mate("m1", 200, "rival"),
      mate("m2", 200, "rival"),
      mate("m3", 200, "rival"),
    ];

    const result = rankTeammates(ownRows, teammates);

    expect(result).toHaveLength(1);
    expect(result[0].puuid).toBe("friend");
    expect(result[0].games).toBe(3);
  });

  it("follows the player's team per match rather than assuming one side", () => {
    // The player is blue in m1 and red in m2; the duo is on their side both times.
    const ownRows = [own("m1", 100, 1), own("m2", 200, 2), own("m3", 200, 3)];
    const teammates = [
      mate("m1", 100, "friend"),
      mate("m2", 200, "friend"),
      mate("m3", 200, "friend"),
    ];

    expect(rankTeammates(ownRows, teammates)[0].games).toBe(3);
  });

  it("drops one-off randoms below the shared-games threshold", () => {
    const ownRows = [own("m1", 100, 1), own("m2", 100, 2), own("m3", 100, 3)];
    const teammates = [
      mate("m1", 100, "friend"),
      mate("m2", 100, "friend"),
      mate("m3", 100, "friend"),
      mate("m1", 100, "random"),
      mate("m2", 100, "random"),
    ];

    expect(rankTeammates(ownRows, teammates).map((c) => c.puuid)).toEqual(["friend"]);
  });

  it("computes the win rate of the games played together", () => {
    const ownRows = [own("m1", 100, 1), own("m2", 100, 2), own("m3", 100, 3), own("m4", 100, 4)];
    const teammates = [
      mate("m1", 100, "friend", true),
      mate("m2", 100, "friend", true),
      mate("m3", 100, "friend", true),
      mate("m4", 100, "friend", false),
    ];

    const [candidate] = rankTeammates(ownRows, teammates);
    expect(candidate.wins).toBe(3);
    expect(candidate.winRate).toBe(75);
  });

  it("shows the name from the most recent game, not the first", () => {
    const ownRows = [own("m1", 100, 1), own("m2", 100, 2), own("m3", 100, 5)];
    const teammates = [
      mate("m1", 100, "friend", true, "OldName", "EUW"),
      mate("m2", 100, "friend", true, "OldName", "EUW"),
      mate("m3", 100, "friend", true, "NewName", "TR1"),
    ];

    const [candidate] = rankTeammates(ownRows, teammates);
    expect(candidate.gameName).toBe("NewName");
    expect(candidate.tagLine).toBe("TR1");
    expect(candidate.lastPlayedAt).toBe(new Date("2026-07-05T12:00:00Z").toISOString());
  });

  it("ranks by games played, breaking ties on win rate", () => {
    const ownRows = Array.from({ length: 6 }, (_, i) => own(`m${i}`, 100, i + 1));
    const teammates = [
      ...Array.from({ length: 5 }, (_, i) => mate(`m${i}`, 100, "most", true)),
      ...Array.from({ length: 3 }, (_, i) => mate(`m${i}`, 100, "tieWin", true)),
      ...Array.from({ length: 3 }, (_, i) => mate(`m${i}`, 100, "tieLoss", false)),
    ];

    expect(rankTeammates(ownRows, teammates).map((c) => c.puuid)).toEqual([
      "most",
      "tieWin",
      "tieLoss",
    ]);
  });

  it("returns nothing when the player has no synced matches", () => {
    expect(rankTeammates([], [mate("m1", 100, "friend")])).toEqual([]);
  });

  it("honours the limit", () => {
    const ownRows = Array.from({ length: 4 }, (_, i) => own(`m${i}`, 100, i + 1));
    const teammates = ["a", "b", "c"].flatMap((p) =>
      Array.from({ length: 4 }, (_, i) => mate(`m${i}`, 100, p)),
    );

    expect(rankTeammates(ownRows, teammates, { limit: 2 })).toHaveLength(2);
  });
});
