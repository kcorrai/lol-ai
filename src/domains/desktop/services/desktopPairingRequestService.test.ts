import { createHash } from "node:crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => {
  const desktopPairingRequest = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  const desktopDevice = {
    findUnique: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  };
  return {
    prisma: {
      desktopPairingRequest,
      desktopDevice,
      user: { findUnique: vi.fn() },
      riotAccount: { findFirst: vi.fn() },
      // Approval mints the device inside a transaction. Handing the callback the same
      // mocks is what lets the assertions below see every write it makes.
      $transaction: vi.fn(async (fn: (tx: unknown) => unknown) =>
        fn({ desktopPairingRequest, desktopDevice })
      ),
    },
  };
});

import { prisma } from "@/lib/db/prisma";
import {
  approvePairingRequest,
  approvePathFor,
  claimPairingRequest,
  getPairingRequest,
  openPairingRequest,
} from "./desktopPairingRequestService";
import { MAX_DEVICES_PER_USER } from "./desktopPairingService";

const SECRET = "a".repeat(64);
const SECRET_HASH = createHash("sha256").update(SECRET, "utf8").digest("hex");

const NOW = new Date("2026-08-29T10:00:00.000Z");
const LATER = new Date("2026-08-29T10:05:00.000Z");
const AFTER_EXPIRY = new Date("2026-08-29T10:20:00.000Z");

const REQUEST_ID = "11111111-2222-4333-8444-555555555555";
const DEVICE_ID = "99999999-8888-4777-8666-555555555555";
const USER_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function requestRow(overrides: Record<string, unknown> = {}) {
  return {
    id: REQUEST_ID,
    secretHash: SECRET_HASH,
    label: "KAAN-PC",
    platform: "windows",
    appVersion: "0.1.0",
    createdAt: NOW,
    expiresAt: new Date(NOW.getTime() + 10 * 60 * 1000),
    approvedAt: null,
    userId: null,
    deviceId: null,
    claimedAt: null,
    ...overrides,
  };
}

function deviceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: DEVICE_ID,
    userId: USER_ID,
    token: "a-device-token",
    label: "KAAN-PC",
    platform: "windows",
    appVersion: "0.1.0",
    createdAt: NOW,
    lastSeenAt: null,
    revokedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("openPairingRequest", () => {
  it("stores only the hash — the secret is never sent and must never be stored", async () => {
    vi.mocked(prisma.desktopPairingRequest.create).mockResolvedValue(requestRow() as never);

    await openPairingRequest(
      { secretHash: SECRET_HASH, label: "KAAN-PC", platform: "windows", appVersion: "0.1.0" },
      NOW
    );

    const written = vi.mocked(prisma.desktopPairingRequest.create).mock.calls[0][0].data;
    expect(written.secretHash).toBe(SECRET_HASH);
    expect(JSON.stringify(written)).not.toContain(SECRET);
  });

  it("hands back a path, never a URL — the app must not be able to choose a host", async () => {
    vi.mocked(prisma.desktopPairingRequest.create).mockResolvedValue(requestRow() as never);

    const opened = await openPairingRequest(
      { secretHash: SECRET_HASH, label: "KAAN-PC", platform: "windows" },
      NOW
    );

    expect(opened.approvePath.startsWith("/")).toBe(true);
    expect(opened.approvePath).toBe(approvePathFor(REQUEST_ID));
    expect(opened.approvePath).not.toContain("//");
  });
});

describe("getPairingRequest", () => {
  it("calls an unapproved request that has run out expired rather than pending", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(requestRow() as never);
    expect((await getPairingRequest(REQUEST_ID, AFTER_EXPIRY))?.status).toBe("expired");
  });

  it("calls an approved one approved, so the page does not offer a second Approve", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(
      requestRow({ approvedAt: LATER, userId: USER_ID, deviceId: DEVICE_ID }) as never
    );
    expect((await getPairingRequest(REQUEST_ID, AFTER_EXPIRY))?.status).toBe("approved");
  });
});

describe("approvePairingRequest", () => {
  it("refuses one that has expired rather than pairing it late", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(requestRow() as never);

    const result = await approvePairingRequest(USER_ID, REQUEST_ID, AFTER_EXPIRY);

    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(prisma.desktopDevice.create).not.toHaveBeenCalled();
  });

  it("refuses a second approval, so two tabs make one device", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(
      requestRow({ approvedAt: LATER, userId: USER_ID }) as never
    );

    const result = await approvePairingRequest(USER_ID, REQUEST_ID, LATER);

    expect(result).toEqual({ ok: false, reason: "already_decided" });
    expect(prisma.desktopDevice.create).not.toHaveBeenCalled();
  });

  it("honours the same device limit redeeming a code does", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(requestRow() as never);
    vi.mocked(prisma.desktopDevice.count).mockResolvedValue(MAX_DEVICES_PER_USER);

    const result = await approvePairingRequest(USER_ID, REQUEST_ID, LATER);

    expect(result).toEqual({ ok: false, reason: "too_many_devices" });
    expect(prisma.desktopDevice.create).not.toHaveBeenCalled();
  });

  // The read above the transaction cannot settle a race; the conditional update is what
  // does, and losing it must not produce a second device.
  it("makes no device when the conditional update loses the race", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(requestRow() as never);
    vi.mocked(prisma.desktopDevice.count).mockResolvedValue(0);
    vi.mocked(prisma.desktopPairingRequest.updateMany).mockResolvedValue({ count: 0 } as never);

    const result = await approvePairingRequest(USER_ID, REQUEST_ID, LATER);

    expect(result).toEqual({ ok: false, reason: "already_decided" });
    expect(prisma.desktopDevice.create).not.toHaveBeenCalled();
  });

  it("mints the device against the approving account, not the machine's word for it", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(requestRow() as never);
    vi.mocked(prisma.desktopDevice.count).mockResolvedValue(0);
    vi.mocked(prisma.desktopPairingRequest.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.desktopDevice.create).mockResolvedValue(deviceRow() as never);

    const result = await approvePairingRequest(USER_ID, REQUEST_ID, LATER);

    expect(result.ok).toBe(true);
    expect(vi.mocked(prisma.desktopDevice.create).mock.calls[0][0].data.userId).toBe(USER_ID);
  });
});

describe("claimPairingRequest", () => {
  it("refuses the wrong secret even though the id is right", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(
      requestRow({ approvedAt: LATER, userId: USER_ID, deviceId: DEVICE_ID }) as never
    );

    const result = await claimPairingRequest(REQUEST_ID, "b".repeat(64), LATER);

    expect(result).toEqual({ ok: false, reason: "invalid" });
    expect(prisma.desktopPairingRequest.updateMany).not.toHaveBeenCalled();
  });

  it("says pending while nobody has approved it, so the app keeps asking", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(requestRow() as never);
    expect(await claimPairingRequest(REQUEST_ID, SECRET, LATER)).toEqual({
      ok: false,
      reason: "pending",
    });
  });

  // Expiry has to be told apart from a wait at *this* end, or the app polls a dead
  // request for the rest of the screen's life.
  it("stops saying pending once the request has run out", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(requestRow() as never);
    expect(await claimPairingRequest(REQUEST_ID, SECRET, AFTER_EXPIRY)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("hands the token over once and refuses the second claim", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(
      requestRow({ approvedAt: LATER, userId: USER_ID, deviceId: DEVICE_ID }) as never
    );
    vi.mocked(prisma.desktopPairingRequest.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.desktopDevice.findUnique).mockResolvedValue(deviceRow() as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: USER_ID,
      email: "k@example.com",
      name: "Kaan",
      emailVerified: null,
    } as never);
    vi.mocked(prisma.riotAccount.findFirst).mockResolvedValue(null as never);

    const first = await claimPairingRequest(REQUEST_ID, SECRET, LATER);
    expect(first).toMatchObject({ ok: true, token: "a-device-token" });

    // Second time round the conditional update finds nothing left to claim.
    vi.mocked(prisma.desktopPairingRequest.updateMany).mockResolvedValue({ count: 0 } as never);
    expect(await claimPairingRequest(REQUEST_ID, SECRET, LATER)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  // A player can open their device list and change their mind in the seconds the app
  // spends polling. The token must not be handed to a device that is already cut off.
  it("refuses a device revoked between approving and claiming", async () => {
    vi.mocked(prisma.desktopPairingRequest.findUnique).mockResolvedValue(
      requestRow({ approvedAt: LATER, userId: USER_ID, deviceId: DEVICE_ID }) as never
    );
    vi.mocked(prisma.desktopPairingRequest.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.desktopDevice.findUnique).mockResolvedValue(
      deviceRow({ revokedAt: LATER }) as never
    );

    expect(await claimPairingRequest(REQUEST_ID, SECRET, LATER)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});
