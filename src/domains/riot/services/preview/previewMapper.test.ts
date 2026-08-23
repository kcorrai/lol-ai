import { describe, expect, it } from "vitest";
import { matchFixture, participantFixture } from "./previewFixtures";
import { toPreviewMatch, toPreviewScoreboard } from "./previewMapper";

const PUUID = "puuid-subject";

describe("toPreviewMatch", () => {
  it("maps the subject's row off a full match DTO", () => {
    const row = toPreviewMatch(matchFixture(PUUID), PUUID);

    expect(row).toMatchObject({
      matchId: "EUW1_1",
      queueType: "RANKED_SOLO_5x5",
      championName: "Ahri",
      championId: 103,
      champLevel: 14,
      win: true,
      position: "MIDDLE",
      kills: 9,
      deaths: 2,
      assists: 11,
      gameDurationSeconds: 1_800,
    });
  });

  it("counts CS as minions plus neutral monsters, and rates it per minute", () => {
    // 200 minions + 31 jungle over a 30 minute game.
    const row = toPreviewMatch(matchFixture(PUUID), PUUID);

    expect(row?.cs).toBe(231);
    expect(row?.csPerMinute).toBe(7.7);
  });

  it("keeps the six inventory slots apart from the trinket", () => {
    const row = toPreviewMatch(matchFixture(PUUID), PUUID);

    expect(row?.itemIds).toEqual([3020, 6653, 3157, 0, 0, 0]);
    expect(row?.trinketId).toBe(3340);
  });

  it("reads the keystone and both rune paths out of perks.styles", () => {
    const row = toPreviewMatch(matchFixture(PUUID), PUUID);

    expect(row).toMatchObject({
      runePrimaryPath: 8200,
      runePrimaryKeystone: 8214,
      runeSecondaryPath: 8100,
    });
  });

  it("leaves runes null when Riot sends no perks at all", () => {
    const dto = matchFixture(PUUID, { subject: { perks: { styles: [] } } });

    const row = toPreviewMatch(dto, PUUID);

    expect(row).toMatchObject({
      runePrimaryPath: null,
      runePrimaryKeystone: null,
      runeSecondaryPath: null,
    });
  });

  it("labels an unknown queue as null rather than guessing", () => {
    const row = toPreviewMatch(matchFixture(PUUID, { queueId: 999_999 }), PUUID);

    expect(row?.queueType).toBeNull();
  });

  /** ARAM and any game Riot could not assign a lane in arrive with an empty teamPosition. */
  it("falls back to FILL when the lane is blank", () => {
    const row = toPreviewMatch(matchFixture(PUUID, { subject: { teamPosition: "" } }), PUUID);

    expect(row?.position).toBe("FILL");
  });

  it("scores kill participation against the subject's own team", () => {
    // Subject 9/11 on blue; four blue fillers at 2 kills each → 17 team kills.
    const row = toPreviewMatch(matchFixture(PUUID), PUUID);

    expect(row?.killParticipation).toBeCloseTo((9 + 11) / 17, 4);
  });

  it("reports zero kill participation rather than dividing by a kill-less team", () => {
    const dto = matchFixture(PUUID, {
      participants: [
        participantFixture({ puuid: PUUID, teamId: 100, kills: 0, assists: 0, win: true }),
        participantFixture({ puuid: "blue-1", teamId: 100, kills: 0, win: true }),
      ],
    });

    expect(toPreviewMatch(dto, PUUID)?.killParticipation).toBe(0);
  });

  /** A remake is seconds long; dividing by it would print an absurd CS/min. */
  it("does not blow up per-minute rates on a near-zero duration", () => {
    const dto = matchFixture(PUUID, { gameDuration: 0 });

    const row = toPreviewMatch(dto, PUUID);

    expect(Number.isFinite(row?.csPerMinute)).toBe(true);
  });

  it("dates the row from gameCreation when gameEndTimestamp is missing", () => {
    const dto = matchFixture(PUUID, { gameEndTimestamp: 0, gameCreation: 1_600_000_000_000 });

    expect(toPreviewMatch(dto, PUUID)?.gameEndedAt).toBe(
      new Date(1_600_000_000_000).toISOString()
    );
  });

  it("returns null when the account is not in the match", () => {
    expect(toPreviewMatch(matchFixture(PUUID), "someone-else")).toBeNull();
  });
});

describe("toPreviewScoreboard", () => {
  it("maps all ten players", () => {
    const board = toPreviewScoreboard(matchFixture(PUUID));

    expect(board.participants).toHaveLength(10);
    expect(board.participants.filter((p) => p.teamId === 100)).toHaveLength(5);
  });

  it("takes the winning team from the teams block", () => {
    expect(toPreviewScoreboard(matchFixture(PUUID, { winningTeam: 200 })).winningTeam).toBe(200);
  });

  it("falls back to the participants when the teams block is unusable", () => {
    const dto = matchFixture(PUUID, { winningTeam: 200 });
    dto.info.teams = [];

    expect(toPreviewScoreboard(dto).winningTeam).toBe(200);
  });

  /** Filling these would cost ten ranked-entry calls per expanded match — see PreviewScoreboard. */
  it("leaves every rank unresolved", () => {
    const board = toPreviewScoreboard(matchFixture(PUUID));

    expect(board.participants.every((p) => p.rankTier === null)).toBe(true);
  });

  it("keys rows by puuid so the scoreboard needs no database row", () => {
    const board = toPreviewScoreboard(matchFixture(PUUID));

    expect(board.participants[0]?.id).toBe(PUUID);
    expect(board.participants[0]?.riotAccountId).toBeNull();
  });

  it("shares damage against the player's own team, not the lobby", () => {
    const board = toPreviewScoreboard(matchFixture(PUUID));
    const blue = board.participants.filter((p) => p.teamId === 100);
    const total = blue.reduce((sum, p) => sum + p.damageShare, 0);

    expect(total).toBeCloseTo(1, 2);
  });

  it("nulls a name Riot did not send instead of leaking an empty string", () => {
    const dto = matchFixture(PUUID, {
      participants: [participantFixture({ puuid: PUUID, riotIdGameName: "", riotIdTagline: "" })],
    });

    expect(toPreviewScoreboard(dto).participants[0]?.gameName).toBeNull();
  });
});
