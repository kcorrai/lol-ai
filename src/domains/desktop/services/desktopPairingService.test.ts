import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => {
  const desktopPairingCode = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const desktopDevice = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  };
  return {
    prisma: {
      desktopPairingCode,
      desktopDevice,
      user: { findUnique: vi.fn() },
      riotAccount: { findFirst: vi.fn() },
      // The service runs the exchange in a transaction. Handing the callback the
      // same mocks means the assertions below see every write it makes.
      $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
        fn({ desktopPairingCode, desktopDevice })
      ),
    },
  };
});

import { prisma } from "@/lib/db/prisma";
import {
  authenticateDevice,
  getDeviceAccount,
  issuePairingCode,
  listDevices,
  MAX_DEVICES_PER_USER,
  redeemPairingCode,
  revokeDevice,
} from "./desktopPairingService";
import { isDeviceTokenFormat } from "@/domains/desktop/deviceToken";
import { isPairingCodeFormat } from "@/domains/desktop/pairingCode";

type Mock = ReturnType<typeof vi.fn>;
const db = prisma as unknown as {
  desktopPairingCode: Record<"findUnique" | "create" | "update" | "updateMany", Mock>;
  desktopDevice: Record<
    "findUnique" | "findMany" | "create" | "update" | "updateMany" | "count",
    Mock
  >;
  user: { findUnique: Mock };
  riotAccount: { findFirst: Mock };
  $transaction: Mock;
};

const NOW = new Date("2026-08-23T12:00:00.000Z");

function deviceRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "device-1",
    userId: "user-1",
    token: "t".repeat(43),
    label: "KAAN-PC",
    platform: "windows",
    appVersion: "0.1.0",
    createdAt: NOW,
    lastSeenAt: null,
    revokedAt: null,
    ...overrides,
  };
}

function codeRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "code-1",
    userId: "user-1",
    code: "ABCDEFGH",
    createdAt: NOW,
    expiresAt: new Date(NOW.getTime() + 60_000),
    consumedAt: null,
    deviceId: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.desktopPairingCode.updateMany.mockResolvedValue({ count: 1 });
  db.desktopPairingCode.create.mockResolvedValue(codeRow());
  db.desktopPairingCode.update.mockResolvedValue(codeRow());
  db.desktopDevice.count.mockResolvedValue(0);
  db.desktopDevice.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
    deviceRow(data)
  );
  db.desktopDevice.updateMany.mockResolvedValue({ count: 1 });
  db.desktopDevice.update.mockResolvedValue(deviceRow());
  db.user.findUnique.mockResolvedValue({ id: "user-1", email: "k@example.com", name: "Kaan" });
  db.riotAccount.findFirst.mockResolvedValue(null);
});

describe("issuePairingCode", () => {
  it("mints a code in the documented format with the documented expiry", async () => {
    const issued = await issuePairingCode("user-1", NOW);

    expect(isPairingCodeFormat(issued.code)).toBe(true);
    expect(new Date(issued.expiresAt).getTime() - NOW.getTime()).toBe(10 * 60 * 1000);
    expect(db.desktopPairingCode.create).toHaveBeenCalledWith({
      data: { userId: "user-1", code: issued.code, expiresAt: new Date(issued.expiresAt) },
    });
  });

  // Otherwise a code read off a screen an hour ago still works, which is the
  // window the short expiry exists to close.
  it("expires whatever was still outstanding for that account", async () => {
    await issuePairingCode("user-1", NOW);

    expect(db.desktopPairingCode.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", consumedAt: null, expiresAt: { gt: NOW } },
      data: { expiresAt: NOW },
    });
  });

  it("does not touch another account's codes", async () => {
    await issuePairingCode("user-2", NOW);

    const where = db.desktopPairingCode.updateMany.mock.calls[0][0].where;
    expect(where.userId).toBe("user-2");
  });
});

describe("redeemPairingCode", () => {
  const input = { code: "ABCDEFGH", label: "KAAN-PC", platform: "windows" as const };

  it("mints a token, creates the device and consumes the code", async () => {
    db.desktopPairingCode.findUnique.mockResolvedValue(codeRow());

    const result = await redeemPairingCode(input, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(isDeviceTokenFormat(result.token)).toBe(true);
    expect(result.device.label).toBe("KAAN-PC");
    expect(result.account.userId).toBe("user-1");

    expect(db.desktopPairingCode.updateMany).toHaveBeenCalledWith({
      where: { id: "code-1", consumedAt: null },
      data: { consumedAt: NOW },
    });
    expect(db.desktopDevice.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        token: result.token,
        label: "KAAN-PC",
        platform: "windows",
        appVersion: null,
      },
    });
  });

  it("accepts the code as it is displayed on the website", async () => {
    db.desktopPairingCode.findUnique.mockResolvedValue(codeRow());

    const result = await redeemPairingCode({ ...input, code: " abcd-efgh " }, NOW);

    expect(result.ok).toBe(true);
    expect(db.desktopPairingCode.findUnique).toHaveBeenCalledWith({ where: { code: "ABCDEFGH" } });
  });

  it("records the reported app version when the client sends one", async () => {
    db.desktopPairingCode.findUnique.mockResolvedValue(codeRow());

    await redeemPairingCode({ ...input, appVersion: "0.2.0" }, NOW);

    expect(db.desktopDevice.create.mock.calls[0][0].data.appVersion).toBe("0.2.0");
  });

  // The label is what the player sees in their device list, and it arrives from
  // an unauthenticated request. The column has no length limit of its own.
  it("trims and truncates the reported label", async () => {
    db.desktopPairingCode.findUnique.mockResolvedValue(codeRow());

    await redeemPairingCode({ ...input, label: `  ${"M".repeat(200)}  ` }, NOW);

    expect(db.desktopDevice.create.mock.calls[0][0].data.label).toBe("M".repeat(64));
  });

  // Every code failure answers the same thing. Telling them apart would let
  // someone guessing codes learn that a guess hit a real account.
  it.each([
    ["a malformed code", () => undefined, { code: "nope" }],
    ["an unknown code", () => db.desktopPairingCode.findUnique.mockResolvedValue(null), {}],
    [
      "an already consumed code",
      () => db.desktopPairingCode.findUnique.mockResolvedValue(codeRow({ consumedAt: NOW })),
      {},
    ],
    [
      "an expired code",
      () =>
        db.desktopPairingCode.findUnique.mockResolvedValue(
          codeRow({ expiresAt: new Date(NOW.getTime() - 1) })
        ),
      {},
    ],
  ])("refuses %s, indistinguishably", async (_label, arrange, patch) => {
    arrange();

    const result = await redeemPairingCode({ ...input, ...patch }, NOW);

    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(db.desktopDevice.create).not.toHaveBeenCalled();
  });

  // A code that expires exactly now is gone. The boundary matters because the
  // issue path writes `expiresAt: now` to kill an outstanding code.
  it("treats a code expiring at this instant as expired", async () => {
    db.desktopPairingCode.findUnique.mockResolvedValue(codeRow({ expiresAt: NOW }));

    expect(await redeemPairingCode(input, NOW)).toEqual({ ok: false, reason: "invalid" });
  });

  it("refuses once the account is at its device limit", async () => {
    db.desktopPairingCode.findUnique.mockResolvedValue(codeRow());
    db.desktopDevice.count.mockResolvedValue(MAX_DEVICES_PER_USER);

    const result = await redeemPairingCode(input, NOW);

    expect(result).toEqual({ ok: false, reason: "too_many_devices" });
    expect(db.desktopPairingCode.updateMany).not.toHaveBeenCalled();
  });

  it("counts only devices that are still live against that limit", async () => {
    db.desktopPairingCode.findUnique.mockResolvedValue(codeRow());

    await redeemPairingCode(input, NOW);

    expect(db.desktopDevice.count).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
    });
  });

  // Two apps racing the same code both get past the read above. The conditional
  // update inside the transaction is what makes only one of them win.
  it("loses the race rather than pairing twice", async () => {
    db.desktopPairingCode.findUnique.mockResolvedValue(codeRow());
    db.desktopPairingCode.updateMany.mockResolvedValue({ count: 0 });

    const result = await redeemPairingCode(input, NOW);

    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(db.desktopDevice.create).not.toHaveBeenCalled();
  });

  it("returns the primary Riot account when one is linked", async () => {
    db.desktopPairingCode.findUnique.mockResolvedValue(codeRow());
    db.riotAccount.findFirst.mockResolvedValue({
      id: "riot-1",
      gameName: "kaanproak0",
      tagLine: "TR1",
      region: "tr1",
      summonerLevel: 300,
      profileIconId: 12,
    });

    const result = await redeemPairingCode(input, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.account.riotAccount).toEqual({
      id: "riot-1",
      gameName: "kaanproak0",
      tagLine: "TR1",
      region: "tr1",
      summonerLevel: 300,
      profileIconId: 12,
    });
    expect(db.riotAccount.findFirst.mock.calls[0][0].orderBy).toEqual([
      { isPrimary: "desc" },
      { createdAt: "asc" },
    ]);
  });

  // A real state, not an error: the app has to say so rather than showing an
  // empty dashboard.
  it("pairs an account with no Riot account linked", async () => {
    db.desktopPairingCode.findUnique.mockResolvedValue(codeRow());

    const result = await redeemPairingCode(input, NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.account.riotAccount).toBeNull();
  });
});

describe("authenticateDevice", () => {
  it("resolves a live token to its device", async () => {
    db.desktopDevice.findUnique.mockResolvedValue(deviceRow());

    const result = await authenticateDevice("t".repeat(43), NOW);

    expect(result?.device.id).toBe("device-1");
  });

  it("touches lastSeenAt, because this is the only place the device speaks", async () => {
    db.desktopDevice.findUnique.mockResolvedValue(deviceRow());

    await authenticateDevice("t".repeat(43), NOW);

    expect(db.desktopDevice.update).toHaveBeenCalledWith({
      where: { id: "device-1" },
      data: { lastSeenAt: NOW },
    });
  });

  // The touch is fire-and-forget on purpose: a failed write must not turn an
  // otherwise good request into an error.
  it("still authenticates when the touch fails", async () => {
    db.desktopDevice.findUnique.mockResolvedValue(deviceRow());
    db.desktopDevice.update.mockRejectedValue(new Error("write conflict"));

    await expect(authenticateDevice("t".repeat(43), NOW)).resolves.not.toBeNull();
  });

  it("refuses an unknown token", async () => {
    db.desktopDevice.findUnique.mockResolvedValue(null);

    expect(await authenticateDevice("t".repeat(43), NOW)).toBeNull();
  });

  it("refuses a revoked device and does not touch it", async () => {
    db.desktopDevice.findUnique.mockResolvedValue(deviceRow({ revokedAt: NOW }));

    expect(await authenticateDevice("t".repeat(43), NOW)).toBeNull();
    expect(db.desktopDevice.update).not.toHaveBeenCalled();
  });
});

describe("getDeviceAccount", () => {
  it("answers with the account the device acts as", async () => {
    const account = await getDeviceAccount(deviceRow() as never);

    expect(account?.userId).toBe("user-1");
    expect(account?.email).toBe("k@example.com");
  });

  it("returns null when the account is gone", async () => {
    db.user.findUnique.mockResolvedValue(null);

    expect(await getDeviceAccount(deviceRow() as never)).toBeNull();
  });
});

describe("listDevices", () => {
  it("lists revoked machines too, newest first", async () => {
    db.desktopDevice.findMany.mockResolvedValue([
      deviceRow({ id: "device-2", revokedAt: NOW }),
      deviceRow(),
    ]);

    const devices = await listDevices("user-1");

    expect(devices.map((d) => d.id)).toEqual(["device-2", "device-1"]);
    expect(devices[0].revokedAt).toBe(NOW.toISOString());
    expect(db.desktopDevice.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("never returns the token", async () => {
    db.desktopDevice.findMany.mockResolvedValue([deviceRow()]);

    const devices = await listDevices("user-1");

    expect(devices[0]).not.toHaveProperty("token");
    expect(JSON.stringify(devices)).not.toContain("t".repeat(43));
  });
});

describe("revokeDevice", () => {
  it("revokes a live device", async () => {
    expect(await revokeDevice("user-1", "device-1", NOW)).toBe(true);
    expect(db.desktopDevice.updateMany).toHaveBeenCalledWith({
      where: { id: "device-1", userId: "user-1", revokedAt: null },
      data: { revokedAt: NOW },
    });
  });

  // Scoped in the query rather than fetched and checked, so someone else's device
  // id is a miss instead of a leak.
  it("cannot revoke a device belonging to another account", async () => {
    db.desktopDevice.updateMany.mockResolvedValue({ count: 0 });

    expect(await revokeDevice("user-2", "device-1", NOW)).toBe(false);
  });

  it("reports nothing done when the device is already revoked", async () => {
    db.desktopDevice.updateMany.mockResolvedValue({ count: 0 });

    expect(await revokeDevice("user-1", "device-1", NOW)).toBe(false);
  });
});
