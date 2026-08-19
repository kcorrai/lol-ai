import { describe, expect, it } from "vitest";
import { parseFrames, participantPuuids } from "@/domains/riot/timeline/parseFrames";
import {
  PUUIDS,
  shortTimeline,
  timelineFixture,
  timelineWithoutParticipantFrames,
} from "@/domains/riot/timeline/timeline.fixture";

const MATCH = "match-db-id";

describe("participantPuuids", () => {
  it("maps every timeline-local participant id to its puuid", () => {
    const map = participantPuuids(timelineFixture());
    expect(map.get(1)).toBe(PUUIDS[1]);
    expect(map.get(7)).toBe(PUUIDS[7]);
    expect(map.size).toBe(Object.keys(PUUIDS).length);
  });
});

describe("parseFrames", () => {
  it("emits one row per participant per frame", () => {
    const rows = parseFrames(MATCH, timelineFixture());
    const participants = Object.keys(PUUIDS).length;
    const frames = timelineFixture().info.frames.length;
    expect(rows).toHaveLength(participants * frames);
    expect(rows.every((r) => r.matchId === MATCH)).toBe(true);
  });

  it("numbers minutes by frame ordinal and keeps the real timestamp beside it", () => {
    const rows = parseFrames(MATCH, timelineFixture());
    const forOne = rows.filter((r) => r.participantId === 1);
    expect(forOne.map((r) => r.minute)).toEqual([0, 1, 2, 3]);
    expect(forOne.map((r) => r.timestampMs)).toEqual([0, 60_000, 120_000, 180_000]);
  });

  it("resolves each row's puuid from the participant map", () => {
    const rows = parseFrames(MATCH, timelineFixture());
    expect(rows.find((r) => r.participantId === 6)?.puuid).toBe(PUUIDS[6]);
  });

  it("carries the gold and farm figures the difference curve is built from", () => {
    const rows = parseFrames(MATCH, timelineFixture());
    const blueTopAt3 = rows.find((r) => r.participantId === 1 && r.minute === 3);
    const redTopAt3 = rows.find((r) => r.participantId === 6 && r.minute === 3);
    expect(blueTopAt3?.totalGold).toBe(500 + 3 * 400);
    expect(redTopAt3?.totalGold).toBe(500 + 3 * 300);
    expect(blueTopAt3?.minionsKilled).toBe(21);
    expect(blueTopAt3?.jungleMinionsKilled).toBe(0);
  });

  it("produces a unique (participantId, minute) pair for every row", () => {
    const rows = parseFrames(MATCH, timelineFixture());
    const keys = new Set(rows.map((r) => `${r.participantId}:${r.minute}`));
    // The unique constraint is what makes the write idempotent, so a collision here would show
    // up in production only as silently dropped rows.
    expect(keys.size).toBe(rows.length);
  });

  // participantFrames is keyed by the participant id as a *string*. Indexing it with a number
  // yields undefined for every player, which is an empty capture rather than an error — this is
  // the test that would catch that regression.
  it("returns nothing rather than throwing when participantFrames is absent", () => {
    expect(parseFrames(MATCH, timelineWithoutParticipantFrames())).toEqual([]);
  });

  it("handles a game that ended after a single frame", () => {
    const rows = parseFrames(MATCH, shortTimeline());
    expect(rows).toHaveLength(Object.keys(PUUIDS).length);
    expect(rows.every((r) => r.minute === 0)).toBe(true);
  });
});
