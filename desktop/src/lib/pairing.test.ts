import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.fn();
const isTauri = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invoke(...args),
  isTauri: () => isTauri(),
}));

import { clearPairing, hasCore, pairDevice, PairingError, readPairing } from "./pairing";

const PAIRING = {
  device: {
    id: "device-1",
    label: "KAAN-PC",
    platform: "windows",
    appVersion: "0.1.0",
    createdAt: "2026-08-23T12:00:00.000Z",
    lastSeenAt: null,
    revokedAt: null,
  },
  account: { userId: "user-1", email: null, name: "Kaan", riotAccount: null },
};

beforeEach(() => {
  vi.clearAllMocks();
  isTauri.mockReturnValue(true);
});

describe("hasCore", () => {
  it("is false in the browser preview", () => {
    isTauri.mockReturnValue(false);
    expect(hasCore()).toBe(false);
  });
});

describe("readPairing", () => {
  it("asks the core", async () => {
    invoke.mockResolvedValue(PAIRING);

    await expect(readPairing()).resolves.toEqual(PAIRING);
    expect(invoke).toHaveBeenCalledWith("device_account");
  });

  it("passes null through — no token this website still accepts", async () => {
    invoke.mockResolvedValue(null);

    await expect(readPairing()).resolves.toBeNull();
  });

  it("does not invoke anything in the browser preview", async () => {
    isTauri.mockReturnValue(false);

    await expect(readPairing()).resolves.toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("pairDevice", () => {
  it("hands the code to the core and returns the account, not a token", async () => {
    invoke.mockResolvedValue(PAIRING);

    const result = await pairDevice("ABCDEFGH");

    expect(invoke).toHaveBeenCalledWith("pair_device", { code: "ABCDEFGH" });
    expect(JSON.stringify(result)).not.toContain("token");
  });

  // Tauri rejects with whatever the command serialised, and AppError serialises to its own
  // message — including the website's, which is the half that says what to do next.
  it("surfaces the message the core produced", async () => {
    invoke.mockRejectedValue("That pairing code is not valid. Generate a new one.");

    await expect(pairDevice("ABCDEFGH")).rejects.toThrow(
      "That pairing code is not valid. Generate a new one."
    );
  });

  it("falls back to a plain message when the rejection is not a string", async () => {
    invoke.mockRejectedValue({ unexpected: true });

    await expect(pairDevice("ABCDEFGH")).rejects.toThrow("Pairing failed. Try again.");
  });

  // Saying "the code was wrong" here would send the player looking for a problem that is
  // not theirs.
  it("says the preview cannot pair rather than failing as a bad code", async () => {
    isTauri.mockReturnValue(false);

    await expect(pairDevice("ABCDEFGH")).rejects.toBeInstanceOf(PairingError);
    await expect(pairDevice("ABCDEFGH")).rejects.toThrow(/preview cannot pair/);
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("clearPairing", () => {
  it("forgets the token through the core", async () => {
    invoke.mockResolvedValue(undefined);

    await clearPairing();

    expect(invoke).toHaveBeenCalledWith("clear_device_token");
  });

  it("is a no-op in the browser preview", async () => {
    isTauri.mockReturnValue(false);

    await clearPairing();

    expect(invoke).not.toHaveBeenCalled();
  });
});
