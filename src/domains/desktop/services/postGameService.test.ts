import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();
const mockDispatch = vi.fn();
const mockRunSync = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock("@/lib/inngest/dispatch", () => ({
  dispatchOrRunInProcess: (...args: unknown[]) => mockDispatch(...args),
}));

vi.mock("@/domains/riot", () => ({
  runSyncWithStatus: (...args: unknown[]) => mockRunSync(...args),
}));

import type { DesktopDevice } from "@prisma/client";
import { requestPostGameSync } from "@/domains/desktop/services/postGameService";

const NOW = new Date("2026-08-23T12:00:00.000Z");
const ACCOUNT_ID = "22222222-2222-2222-2222-222222222222";

const DEVICE: DesktopDevice = {
  id: "6f1b1f7a-0f7e-4a2b-9d1e-2c3a4b5c6d7e",
  userId: "user-1",
  token: "t".repeat(43),
  label: "KAAN-PC",
  platform: "windows",
  appVersion: "0.1.0",
  createdAt: new Date("2026-08-01T12:00:00.000Z"),
  lastSeenAt: null,
  revokedAt: null,
};

function account(over: Record<string, unknown> = {}) {
  return { id: ACCOUNT_ID, syncStatus: "COMPLETED", syncStartedAt: null, ...over };
}

/** Minutes before `NOW`, for the stuck-sync window. */
function minutesAgo(n: number): Date {
  return new Date(NOW.getTime() - n * 60_000);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFindFirst.mockResolvedValue(account());
  mockUpdate.mockResolvedValue({});
  mockDispatch.mockResolvedValue(undefined);
});

describe("requestPostGameSync", () => {
  it("marks the account pending and dispatches the pull", async () => {
    const result = await requestPostGameSync(DEVICE, NOW);

    expect(result).toEqual({ status: "pending", riotAccountId: ACCOUNT_ID });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: ACCOUNT_ID },
      data: { syncStatus: "PENDING", syncStartedAt: NOW, lastSyncError: null },
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("sends the event the website's own sync sends", async () => {
    await requestPostGameSync(DEVICE, NOW);

    const [event] = mockDispatch.mock.calls[0];
    // A game reported by the app and one reported by a browser must be pulled by the same
    // code, or the two paths drift and only one of them gets fixed.
    expect(event).toEqual({
      name: "riot/sync.requested",
      data: { riotAccountId: ACCOUNT_ID, userId: "user-1" },
    });
  });

  it("falls back to the in-process run with the same arguments", async () => {
    await requestPostGameSync(DEVICE, NOW);

    const [, fallback] = mockDispatch.mock.calls[0];
    await (fallback as () => Promise<unknown>)();
    expect(mockRunSync).toHaveBeenCalledWith(ACCOUNT_ID, "user-1");
  });
});

describe("requestPostGameSync picks the account, and the caller does not", () => {
  // The property that makes this endpoint safe behind a device token: a stolen one cannot
  // name an account to pull.
  it("reads the account from the device's own user, primary first", async () => {
    await requestPostGameSync(DEVICE, NOW);

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: { id: true, syncStatus: true, syncStartedAt: true },
    });
  });

  it("reports a paired machine whose account has no Riot account linked", async () => {
    mockFindFirst.mockResolvedValue(null);

    expect(await requestPostGameSync(DEVICE, NOW)).toEqual({ status: "no_riot_account" });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

describe("requestPostGameSync and a sync already under way", () => {
  it.each(["RUNNING", "PENDING"])("does not start a second one over a live %s", async (status) => {
    mockFindFirst.mockResolvedValue(account({ syncStatus: status, syncStartedAt: minutesAgo(1) }));

    const result = await requestPostGameSync(DEVICE, NOW);

    expect(result).toEqual({ status: "already_running", riotAccountId: ACCOUNT_ID });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // A run that died, or an Inngest event nothing ever processed, would otherwise wedge the
  // account for ever — the app would report every game and none would be pulled.
  it("treats a sync stuck for more than five minutes as gone and starts a fresh one", async () => {
    mockFindFirst.mockResolvedValue(
      account({ syncStatus: "RUNNING", syncStartedAt: minutesAgo(6) })
    );

    expect(await requestPostGameSync(DEVICE, NOW)).toMatchObject({ status: "pending" });
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("treats a RUNNING account that never recorded a start as stuck", async () => {
    mockFindFirst.mockResolvedValue(account({ syncStatus: "RUNNING", syncStartedAt: null }));

    expect(await requestPostGameSync(DEVICE, NOW)).toMatchObject({ status: "pending" });
  });

  it("starts a sync over a previous failure", async () => {
    mockFindFirst.mockResolvedValue(
      account({ syncStatus: "FAILED", syncStartedAt: minutesAgo(1) })
    );

    expect(await requestPostGameSync(DEVICE, NOW)).toMatchObject({ status: "pending" });
    // And clears the recorded error, so a stale message is not shown beside a live run.
    expect(mockUpdate.mock.calls[0][0].data.lastSyncError).toBeNull();
  });
});
