import type { PreviewMatch } from "@/types/preview";

/**
 * A complete `PreviewMatch` for tests that only care about two or three of its fields.
 *
 * Shared rather than rebuilt per spec because three specs — the Discord card formatter, the
 * lookup command and the profile's role split — each had their own hand-written literal, and
 * every field added to the row broke all three at once (LA-69).
 */
export function previewMatchFixture(over: Partial<PreviewMatch> = {}): PreviewMatch {
  return {
    matchId: "EUW1_1",
    queueType: "RANKED_SOLO_5x5",
    gameDurationSeconds: 1_800,
    gameEndedAt: "2026-08-20T12:00:00.000Z",
    championId: 103,
    championName: "Ahri",
    champLevel: 16,
    win: true,
    position: "MIDDLE",
    kills: 9,
    deaths: 2,
    assists: 11,
    cs: 231,
    csPerMinute: 7.7,
    visionScore: 22,
    goldEarned: 13_500,
    damageDealt: 24_000,
    killParticipation: 0.7,
    itemIds: [3020, 6653, 3157, 0, 0, 0],
    trinketId: 3340,
    summonerSpell1: 4,
    summonerSpell2: 14,
    runePrimaryKeystone: 8214,
    runePrimaryPath: 8200,
    runeSecondaryPath: 8100,
    ...over,
  };
}
