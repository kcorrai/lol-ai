import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: {
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/inngest/client", () => ({
  inngest: {
    createFunction: vi.fn((_config: unknown, handler: unknown) => handler),
  },
}));

vi.mock("@/domains/riot/services/matchSyncService", () => ({
  syncAccount: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { syncAccount } from "@/domains/riot/services/matchSyncService";

const mockRiotAccount = prisma.riotAccount as ReturnType<
  typeof vi.mocked<typeof prisma.riotAccount>
>;
const mockSyncAccount = vi.mocked(syncAccount);

const ACCOUNT_ID = "account-uuid-123";
const USER_ID = "user-uuid-456";

async function runHandler(riotAccountId: string, userId: string) {
  const handler = vi.fn(
    async ({ event }: { event: { data: { riotAccountId: string; userId: string } } }) => {
      const { riotAccountId: id } = event.data;

      await prisma.riotAccount.update({
        where: { id },
        data: { syncStatus: "RUNNING", syncStartedAt: new Date(), lastSyncError: null },
      });

      try {
        const result = await syncAccount(id, true);
        await prisma.riotAccount.update({
          where: { id },
          data: { syncStatus: "COMPLETED", syncCompletedAt: new Date() },
        });
        return { status: "completed", ...result };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await prisma.riotAccount.update({
          where: { id },
          data: { syncStatus: "FAILED", lastSyncError: errorMsg },
        });
        throw err;
      }
    }
  );

  return handler({ event: { data: { riotAccountId, userId } } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("matchSyncWorker", () => {
  it("sync başladığında status RUNNING olarak güncelleniyor", async () => {
    mockSyncAccount.mockResolvedValueOnce({
      newMatches: 5,
      skipped: 0,
      rankedSnapshotted: true,
      errors: [],
    });

    await runHandler(ACCOUNT_ID, USER_ID);

    expect(mockRiotAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ syncStatus: "RUNNING" }),
      })
    );
  });

  it("başarılı sync sonrası status COMPLETED olarak güncelleniyor", async () => {
    mockSyncAccount.mockResolvedValueOnce({
      newMatches: 3,
      skipped: 1,
      rankedSnapshotted: true,
      errors: [],
    });

    const result = await runHandler(ACCOUNT_ID, USER_ID);

    expect(mockRiotAccount.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ syncStatus: "COMPLETED" }),
      })
    );
    expect(result).toMatchObject({ status: "completed", newMatches: 3 });
  });

  it("syncAccount hata fırlatırsa status FAILED + hata mesajı kaydediliyor", async () => {
    mockSyncAccount.mockRejectedValueOnce(new Error("Riot API 503"));

    await expect(runHandler(ACCOUNT_ID, USER_ID)).rejects.toThrow("Riot API 503");

    expect(mockRiotAccount.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          syncStatus: "FAILED",
          lastSyncError: "Riot API 503",
        }),
      })
    );
  });

  it("RUNNING güncellemesinde lastSyncError temizleniyor", async () => {
    mockSyncAccount.mockResolvedValueOnce({
      newMatches: 0,
      skipped: 0,
      rankedSnapshotted: false,
      errors: [],
    });

    await runHandler(ACCOUNT_ID, USER_ID);

    expect(mockRiotAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastSyncError: null }),
      })
    );
  });
});
