import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const update = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("@/lib/db/userLock", () => ({
  // The real one opens a transaction and takes a Postgres advisory lock. What matters
  // to these cases is that the read and the write see the same client.
  withUserLock: (_userId: string, fn: (tx: unknown) => Promise<unknown>) =>
    fn({ user: { findUnique, update } }),
}));

import { mergeProfileSettings } from "./profileSettingsStore";

function stored(): Record<string, unknown> {
  return update.mock.calls.at(-1)?.[0].data.profileSettings as Record<string, unknown>;
}

beforeEach(() => {
  findUnique.mockReset();
  update.mockReset();
  update.mockResolvedValue({});
});

describe("mergeProfileSettings", () => {
  /**
   * The bug this exists to stop. Requesting account deletion assigned the column, which
   * deleted the visibility flags — whose defaults are *shown* — so asking to be erased
   * quietly made the account more public than the user had left it.
   */
  it("keeps keys the caller did not send", async () => {
    findUnique.mockResolvedValue({
      profileSettings: { showRank: false, showWR: false },
    });

    await mergeProfileSettings("user-1", { deletionScheduledAt: "2026-09-18T00:00:00.000Z" });

    expect(stored()).toEqual({
      showRank: false,
      showWR: false,
      deletionScheduledAt: "2026-09-18T00:00:00.000Z",
    });
  });

  // And the other direction: a settings change used to wipe `deletionScheduledAt`, which
  // is the only thing `gdprErasure` reads before deciding the erasure was called off.
  it("does not disturb a pending erasure", async () => {
    findUnique.mockResolvedValue({
      profileSettings: { deletionScheduledAt: "2026-09-18T00:00:00.000Z" },
    });

    await mergeProfileSettings("user-1", { showBadges: false });

    expect(stored().deletionScheduledAt).toBe("2026-09-18T00:00:00.000Z");
    expect(stored().showBadges).toBe(false);
  });

  it("deletes a key when its value is null", async () => {
    findUnique.mockResolvedValue({
      profileSettings: { deletionScheduledAt: "2026-09-18T00:00:00.000Z", showRank: true },
    });

    await mergeProfileSettings("user-1", { deletionScheduledAt: null });

    expect(stored()).toEqual({ showRank: true });
  });

  it("starts from an empty object when the column is null or not an object", async () => {
    findUnique.mockResolvedValue({ profileSettings: null });
    await mergeProfileSettings("user-1", { showRank: true });
    expect(stored()).toEqual({ showRank: true });

    findUnique.mockResolvedValue({ profileSettings: ["not", "an", "object"] });
    await mergeProfileSettings("user-1", { showRank: true });
    expect(stored()).toEqual({ showRank: true });
  });
});
