import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    riotAccount: { findFirst: vi.fn(), delete: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/db/prisma";
import { disconnectAccount } from "./accountService";

const USER_ID = "user-1";
const ACCOUNT_ID = "acc-1";

/** Stands in for the client Prisma hands the interactive-transaction callback. */
function fakeTx() {
  return {
    riotAccount: {
      delete: vi.fn().mockResolvedValue({}),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
    },
  };
}

function runsTransactionWith(tx: ReturnType<typeof fakeTx>) {
  vi.mocked(prisma.$transaction).mockImplementation((fn) => (fn as never as (t: unknown) => Promise<unknown>)(tx) as never);
}

/** The account being disconnected, as the ownership lookup returns it. */
function existingAccount(isPrimary: boolean) {
  vi.mocked(prisma.riotAccount.findFirst).mockResolvedValue({
    id: ACCOUNT_ID,
    userId: USER_ID,
    isPrimary,
  } as never);
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("disconnectAccount", () => {
  it("rejects an account that does not belong to the user", async () => {
    vi.mocked(prisma.riotAccount.findFirst).mockResolvedValue(null);

    await expect(disconnectAccount(USER_ID, ACCOUNT_ID)).rejects.toThrow();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("scopes the ownership lookup to the session user", async () => {
    existingAccount(false);
    runsTransactionWith(fakeTx());

    await disconnectAccount(USER_ID, ACCOUNT_ID);

    expect(prisma.riotAccount.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: ACCOUNT_ID, userId: USER_ID } })
    );
  });

  /**
   * The defect this task closes: delete and promote used to be separate statements, so a failed
   * promotion left the user with no primary account — a state the rest of the app assumes cannot
   * happen.
   */
  it("deletes and promotes on the same transaction client", async () => {
    existingAccount(true);
    const tx = fakeTx();
    tx.riotAccount.findFirst.mockResolvedValue({ id: "acc-2" } as never);
    runsTransactionWith(tx);

    await disconnectAccount(USER_ID, ACCOUNT_ID);

    expect(tx.riotAccount.delete).toHaveBeenCalledWith({ where: { id: ACCOUNT_ID } });
    expect(tx.riotAccount.update).toHaveBeenCalledWith({
      where: { id: "acc-2" },
      data: { isPrimary: true },
    });
    // Neither write may go to the singleton, or they are outside the transaction.
    expect(prisma.riotAccount.delete).not.toHaveBeenCalled();
    expect(prisma.riotAccount.update).not.toHaveBeenCalled();
  });

  it("promotes the oldest remaining account", async () => {
    existingAccount(true);
    const tx = fakeTx();
    tx.riotAccount.findFirst.mockResolvedValue({ id: "acc-2" } as never);
    runsTransactionWith(tx);

    await disconnectAccount(USER_ID, ACCOUNT_ID);

    expect(tx.riotAccount.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID },
        orderBy: { createdAt: "asc" },
      })
    );
  });

  it("does not promote anything when the disconnected account was not primary", async () => {
    existingAccount(false);
    const tx = fakeTx();
    runsTransactionWith(tx);

    await disconnectAccount(USER_ID, ACCOUNT_ID);

    expect(tx.riotAccount.delete).toHaveBeenCalledOnce();
    expect(tx.riotAccount.findFirst).not.toHaveBeenCalled();
    expect(tx.riotAccount.update).not.toHaveBeenCalled();
  });

  it("deletes the last account without trying to promote a successor", async () => {
    existingAccount(true);
    const tx = fakeTx(); // findFirst resolves null — nothing left
    runsTransactionWith(tx);

    await disconnectAccount(USER_ID, ACCOUNT_ID);

    expect(tx.riotAccount.delete).toHaveBeenCalledOnce();
    expect(tx.riotAccount.update).not.toHaveBeenCalled();
  });

  it("propagates a failed promotion so the delete rolls back", async () => {
    existingAccount(true);
    const tx = fakeTx();
    tx.riotAccount.findFirst.mockResolvedValue({ id: "acc-2" } as never);
    tx.riotAccount.update.mockRejectedValue(new Error("promote failed"));
    runsTransactionWith(tx);

    await expect(disconnectAccount(USER_ID, ACCOUNT_ID)).rejects.toThrow("promote failed");
  });
});
