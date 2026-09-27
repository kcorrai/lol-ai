import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: { riotAccount: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock("@/lib/inngest/dispatch", () => ({ dispatchOrRunInProcess: vi.fn() }));
vi.mock("@/domains/riot/services/matchSyncService", () => ({ runSyncWithStatus: vi.fn() }));

import { prisma } from "@/lib/db/prisma";
import { dispatchOrRunInProcess } from "@/lib/inngest/dispatch";
import { requestSyncIfStale, SYNC_ATTEMPT_COOLDOWN_MS } from "./syncFreshness";

const NOW = new Date("2026-09-27T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms);
const HOUR = 60 * 60 * 1000;

function account(fields: {
  lastSyncedAt?: Date | null;
  syncStatus?: string;
  syncStartedAt?: Date | null;
}) {
  vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue({
    lastSyncedAt: null,
    syncStatus: "IDLE",
    syncStartedAt: null,
    ...fields,
  } as never);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("requestSyncIfStale", () => {
  it("starts a sync for a stale account", async () => {
    account({ lastSyncedAt: ago(HOUR), syncStartedAt: ago(HOUR) });

    expect(await requestSyncIfStale("acc", "user", NOW, 3 * 60 * 1000)).toEqual({
      requested: true,
    });
    expect(dispatchOrRunInProcess).toHaveBeenCalledTimes(1);
  });

  it("starts one for an account that has never synced", async () => {
    account({});

    expect((await requestSyncIfStale("acc", "user", NOW)).requested).toBe(true);
  });

  it("does not start another while one is running", async () => {
    account({ syncStatus: "RUNNING", syncStartedAt: ago(30_000) });

    expect(await requestSyncIfStale("acc", "user", NOW)).toEqual({
      requested: false,
      reason: "in-progress",
      status: "RUNNING",
    });
    expect(dispatchOrRunInProcess).not.toHaveBeenCalled();
  });

  it("does not retry a sync that failed moments ago, however stale the data is", async () => {
    // Riot limited us an instant ago: the last success is an hour old, the last attempt is not.
    account({ lastSyncedAt: ago(HOUR), syncStatus: "FAILED", syncStartedAt: ago(20_000) });

    expect(await requestSyncIfStale("acc", "user", NOW, 0)).toMatchObject({
      requested: false,
      reason: "recent",
    });
    expect(dispatchOrRunInProcess).not.toHaveBeenCalled();
  });

  it("retries once the cooldown since the last attempt has passed", async () => {
    account({
      lastSyncedAt: ago(HOUR),
      syncStatus: "FAILED",
      syncStartedAt: ago(SYNC_ATTEMPT_COOLDOWN_MS + 1),
    });

    expect((await requestSyncIfStale("acc", "user", NOW, 0)).requested).toBe(true);
  });

  it("says when the account does not exist", async () => {
    vi.mocked(prisma.riotAccount.findUnique).mockResolvedValue(null);

    expect(await requestSyncIfStale("acc", "user", NOW)).toEqual({
      requested: false,
      reason: "missing",
    });
  });
});
