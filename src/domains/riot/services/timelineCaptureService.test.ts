import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCapture = vi.fn();
const mockAccountFindUnique = vi.fn();
const mockParticipantFindMany = vi.fn();

vi.mock("@/domains/riot/services/timelineService", () => ({
  captureMatchTimeline: (...args: unknown[]) => mockCapture(...args),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: { findUnique: (...a: unknown[]) => mockAccountFindUnique(...a) },
    matchParticipant: { findMany: (...a: unknown[]) => mockParticipantFindMany(...a) },
  },
}));

vi.mock("@/lib/utils/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { runTimelineCaptureForAccount } from "@/domains/riot/services/timelineCaptureService";

const ACCOUNT = "11111111-1111-1111-1111-111111111111";

function participant(matchId: string, championName = "Veigar") {
  return { championName, match: { id: `db-${matchId}`, matchId } };
}

function captured(over: Record<string, unknown> = {}) {
  return { deaths: 5, frames: 350, events: 900, skipped: false, ...over };
}

/**
 * The loop waits 1.2s after every real fetch to stay under Riot's rate limit. That wait is
 * the point in production and pure tax in a test run, so it is advanced rather than served.
 */
async function run(accountId: string) {
  const promise = runTimelineCaptureForAccount(accountId);
  await vi.advanceTimersByTimeAsync(60_000);
  return promise;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockAccountFindUnique.mockResolvedValue({ puuid: "puuid-1", region: "tr1" });
  mockParticipantFindMany.mockResolvedValue([]);
  mockCapture.mockResolvedValue(captured({ skipped: true, deaths: 0, frames: 0, events: 0 }));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("runTimelineCaptureForAccount", () => {
  it("answers with nothing when the account is gone, without asking for work", async () => {
    mockAccountFindUnique.mockResolvedValue(null);

    expect(await run(ACCOUNT)).toEqual({
      processed: 0,
      fetched: 0,
      totalDeaths: 0,
      totalFrames: 0,
      totalEvents: 0,
    });
    expect(mockParticipantFindMany).not.toHaveBeenCalled();
  });

  it("passes the account's own puuid and region to the capture", async () => {
    mockParticipantFindMany.mockResolvedValue([participant("TR1_1", "Ahri")]);
    mockCapture.mockResolvedValue(captured());

    await run(ACCOUNT);

    expect(mockCapture).toHaveBeenCalledWith("db-TR1_1", "TR1_1", ACCOUNT, "puuid-1", "tr1", "Ahri");
  });

  it("sums what the captures reported", async () => {
    mockParticipantFindMany.mockResolvedValue([participant("TR1_1"), participant("TR1_2")]);
    mockCapture
      .mockResolvedValueOnce(captured({ deaths: 10, frames: 400, events: 1293 }))
      .mockResolvedValueOnce(captured({ deaths: 7, frames: 290, events: 780 }));

    const summary = await run(ACCOUNT);

    expect(summary).toEqual({
      processed: 2,
      fetched: 2,
      totalDeaths: 17,
      totalFrames: 690,
      totalEvents: 2073,
    });
  });

  // A match that turned out to be fully captured never touched Riot, so counting it as a fetch
  // would spend the rate-limit budget the pause exists to protect.
  it("does not count a skipped match as a fetch", async () => {
    mockParticipantFindMany.mockResolvedValue([participant("TR1_1"), participant("TR1_2")]);
    mockCapture
      .mockResolvedValueOnce(captured({ skipped: true, deaths: 0, frames: 0, events: 0 }))
      .mockResolvedValueOnce(captured({ deaths: 1, frames: 300, events: 500 }));

    const summary = await run(ACCOUNT);

    expect(summary.processed).toBe(2);
    expect(summary.fetched).toBe(1);
  });
});

describe("runTimelineCaptureForAccount work list", () => {
  it("asks for ranked matches missing either half of the capture", async () => {
    await run(ACCOUNT);

    const [query] = mockParticipantFindMany.mock.calls[0];
    expect(query.where.puuid).toBe("puuid-1");
    expect(query.where.match.queueType).toBe("RANKED_SOLO_5x5");
    // Two conditions, not one: death events are per-account and frames are per-match, so a
    // match already processed for deaths would otherwise never get its frames (ADR-033).
    expect(query.where.OR).toEqual([
      { match: { deathEvents: { none: { riotAccountId: ACCOUNT } } } },
      { match: { timelineFrames: { none: {} } } },
    ]);
  });

  it("takes the newest twenty, so one account cannot spend the whole Riot budget", async () => {
    await run(ACCOUNT);

    const [query] = mockParticipantFindMany.mock.calls[0];
    expect(query.take).toBe(20);
    expect(query.orderBy).toEqual({ match: { gameStart: "desc" } });
  });

  // Matched by puuid rather than riotAccountId so a shared account's matches are all
  // processed (TASK-228), while the death events stay scoped to this account.
  it("keys the match half on the puuid and the death half on the account", async () => {
    await run(ACCOUNT);

    const [query] = mockParticipantFindMany.mock.calls[0];
    expect(query.where.puuid).toBe("puuid-1");
    expect(JSON.stringify(query.where.OR)).toContain(ACCOUNT);
  });
});
