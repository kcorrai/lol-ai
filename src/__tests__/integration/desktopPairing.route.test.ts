import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/domains/desktop/services/desktopPairingService", () => ({
  issuePairingCode: vi.fn(),
  redeemPairingCode: vi.fn(),
  authenticateDevice: vi.fn(),
  getDeviceAccount: vi.fn(),
  listDevices: vi.fn(),
  revokeDevice: vi.fn(),
  toDeviceSummary: vi.fn((d: { id: string }) => ({ id: d.id, label: "KAAN-PC" })),
}));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/rateLimit")>()),
  checkRateLimit: vi.fn(),
}));

import { POST as issue } from "../../../app/api/desktop/pairing-code/route";
import { POST as pair } from "../../../app/api/desktop/pair/route";
import { GET as me } from "../../../app/api/desktop/me/route";
import { GET as devices } from "../../../app/api/desktop/devices/route";
import { DELETE as revoke } from "../../../app/api/desktop/devices/[deviceId]/route";
import {
  authenticateDevice,
  getDeviceAccount,
  issuePairingCode,
  listDevices,
  redeemPairingCode,
  revokeDevice,
} from "@/domains/desktop/services/desktopPairingService";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { generateDeviceToken } from "@/domains/desktop/deviceToken";
import {
  authenticateAs,
  authenticateAsNobody,
  readApiResponse,
  routeRequest,
} from "@/test/apiRoute";

const DEVICE_ID = "6f1b1f7a-0f7e-4a2b-9d1e-2c3a4b5c6d7e";
const TOKEN = generateDeviceToken();

const DEVICE = {
  id: DEVICE_ID,
  label: "KAAN-PC",
  platform: "windows" as const,
  appVersion: "0.1.0",
  createdAt: "2026-08-23T12:00:00.000Z",
  lastSeenAt: null,
  revokedAt: null,
};

const ACCOUNT = {
  userId: "user-1",
  email: "k@example.com",
  name: "Kaan",
  emailVerified: null,
  riotAccount: null,
};

const PAIR_BODY = { code: "ABCD-EFGH", label: "KAAN-PC", platform: "windows" };

beforeEach(() => {
  vi.resetAllMocks();
  authenticateAs({ id: "user-1" });
  vi.mocked(checkRateLimit).mockResolvedValue({
    allowed: true,
    retryAfterMs: 0,
    limit: 10,
    remaining: 9,
  });
});

describe("POST /api/desktop/pairing-code", () => {
  it("mints a code for the signed-in player", async () => {
    vi.mocked(issuePairingCode).mockResolvedValue({
      code: "ABCDEFGH",
      expiresAt: "2026-08-23T12:10:00.000Z",
    });

    const { status, data } = await readApiResponse<{ code: string }>(
      await issue(routeRequest("/api/desktop/pairing-code", { method: "POST" }))
    );

    expect(status).toBe(200);
    expect(data?.code).toBe("ABCDEFGH");
    expect(issuePairingCode).toHaveBeenCalledWith("user-1");
  });

  it("refuses without a session", async () => {
    authenticateAsNobody();

    const { status } = await readApiResponse(
      await issue(routeRequest("/api/desktop/pairing-code", { method: "POST" }))
    );

    expect(status).toBe(401);
    expect(issuePairingCode).not.toHaveBeenCalled();
  });

  // Each call burns the previous code, so a loop here would leave a player whose
  // app is mid-exchange staring at a code that died while they typed it.
  it("is rate limited per account", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterMs: 60_000,
      limit: 10,
      remaining: 0,
    });

    const res = await issue(routeRequest("/api/desktop/pairing-code", { method: "POST" }));

    expect(res.status).toBe(429);
    expect(vi.mocked(checkRateLimit).mock.calls[0][0]).toBe("desktop-code:user-1");
    expect(issuePairingCode).not.toHaveBeenCalled();
  });
});

describe("POST /api/desktop/pair", () => {
  it("hands back a token, the device and the account", async () => {
    vi.mocked(redeemPairingCode).mockResolvedValue({
      ok: true,
      token: TOKEN,
      device: DEVICE,
      account: ACCOUNT,
    });

    const res = await pair(routeRequest("/api/desktop/pair", { body: PAIR_BODY }));
    const { status, data } = await readApiResponse<{ token: string }>(res);

    expect(status).toBe(201);
    expect(data?.token).toBe(TOKEN);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  // The caller is a native process with no session and no cookie jar. Requiring
  // one here would make the endpoint unreachable by the only client it has.
  it("needs no session", async () => {
    authenticateAsNobody();
    vi.mocked(redeemPairingCode).mockResolvedValue({
      ok: true,
      token: TOKEN,
      device: DEVICE,
      account: ACCOUNT,
    });

    const { status } = await readApiResponse(
      await pair(routeRequest("/api/desktop/pair", { body: PAIR_BODY }))
    );

    expect(status).toBe(201);
  });

  it.each([
    ["a malformed body", "{ not json"],
    ["a missing code", { label: "KAAN-PC", platform: "windows" }],
    ["a missing label", { code: "ABCDEFGH", platform: "windows" }],
    ["an unknown platform", { ...PAIR_BODY, platform: "freebsd" }],
    ["an empty label", { ...PAIR_BODY, label: "" }],
  ])("refuses %s with 422", async (_label, body) => {
    const { status, error } = await readApiResponse(
      await pair(routeRequest("/api/desktop/pair", { body }))
    );

    expect(status).toBe(422);
    expect(error?.code).toBe("VALIDATION_ERROR");
    expect(redeemPairingCode).not.toHaveBeenCalled();
  });

  // Nothing wraps this handler, so a thrown ApiError would reach the client as a
  // 500 rather than the message it carries.
  it("answers a rejected code with 422 rather than a crash", async () => {
    vi.mocked(redeemPairingCode).mockResolvedValue({ ok: false, reason: "invalid" });

    const { status, error } = await readApiResponse(
      await pair(routeRequest("/api/desktop/pair", { body: PAIR_BODY }))
    );

    expect(status).toBe(422);
    expect(error?.code).toBe("VALIDATION_ERROR");
  });

  it("names the device limit, which is the one refusal a player can act on", async () => {
    vi.mocked(redeemPairingCode).mockResolvedValue({ ok: false, reason: "too_many_devices" });

    const { status, error } = await readApiResponse(
      await pair(routeRequest("/api/desktop/pair", { body: PAIR_BODY }))
    );

    expect(status).toBe(409);
    expect(error?.code).toBe("DEVICE_LIMIT_REACHED");
  });

  // The gate that makes a ~39-bit code safe to guess against. Keyed on the caller
  // rather than the code: keying on the code would let a guesser lock out the
  // very code they are guessing.
  it("is rate limited per caller, before the code is looked at", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterMs: 60_000,
      limit: 10,
      remaining: 0,
    });

    const res = await pair(routeRequest("/api/desktop/pair", { body: PAIR_BODY }));

    expect(res.status).toBe(429);
    expect(vi.mocked(checkRateLimit).mock.calls[0][0]).toMatch(/^desktop-pair:/);
    expect(redeemPairingCode).not.toHaveBeenCalled();
  });
});

describe("GET /api/desktop/me", () => {
  function request(headers: Record<string, string> = { authorization: `Bearer ${TOKEN}` }) {
    return routeRequest("/api/desktop/me", { headers });
  }

  it("answers with the device and the account it acts as", async () => {
    vi.mocked(authenticateDevice).mockResolvedValue({ device: { id: DEVICE_ID } as never });
    vi.mocked(getDeviceAccount).mockResolvedValue(ACCOUNT);

    const { status, data } = await readApiResponse<{ account: typeof ACCOUNT }>(
      await me(request())
    );

    expect(status).toBe(200);
    expect(data?.account.userId).toBe("user-1");
    expect(authenticateDevice).toHaveBeenCalledWith(TOKEN);
  });

  it.each([
    ["no header", {}],
    ["the wrong scheme", { authorization: `Basic ${TOKEN}` }],
    ["a malformed token", { authorization: "Bearer nope" }],
  ])("refuses %s without touching the database", async (_label, headers) => {
    const { status } = await readApiResponse(await me(request(headers)));

    expect(status).toBe(401);
    expect(authenticateDevice).not.toHaveBeenCalled();
  });

  // A revoked device and an unknown token are the same answer. A machine that has
  // been cut off learns only that it is no longer welcome.
  it("refuses a token the service rejects", async () => {
    vi.mocked(authenticateDevice).mockResolvedValue(null);

    const { status, error } = await readApiResponse(await me(request()));

    expect(status).toBe(401);
    expect(error?.message).toBe("This device is not paired");
  });

  it("refuses when the account behind the device is gone", async () => {
    vi.mocked(authenticateDevice).mockResolvedValue({ device: { id: DEVICE_ID } as never });
    vi.mocked(getDeviceAccount).mockResolvedValue(null);

    expect((await me(request())).status).toBe(401);
  });

  // A session cookie is not a device token, and this route must not accept one.
  it("does not accept a browser session in place of a token", async () => {
    authenticateAs({ id: "user-1" });

    expect((await me(routeRequest("/api/desktop/me"))).status).toBe(401);
  });
});

describe("GET /api/desktop/devices", () => {
  it("lists the machines, revoked ones included", async () => {
    vi.mocked(listDevices).mockResolvedValue([DEVICE, { ...DEVICE, id: "d2", revokedAt: "x" }]);

    const { status, data } = await readApiResponse<{ devices: unknown[] }>(
      await devices(routeRequest("/api/desktop/devices"))
    );

    expect(status).toBe(200);
    expect(data?.devices).toHaveLength(2);
    expect(listDevices).toHaveBeenCalledWith("user-1");
  });

  it("refuses without a session", async () => {
    authenticateAsNobody();

    expect((await devices(routeRequest("/api/desktop/devices"))).status).toBe(401);
  });
});

describe("DELETE /api/desktop/devices/[deviceId]", () => {
  function request(deviceId: string) {
    return revoke(routeRequest(`/api/desktop/devices/${deviceId}`, { method: "DELETE" }), {
      params: { deviceId },
    });
  }

  it("revokes the machine", async () => {
    vi.mocked(revokeDevice).mockResolvedValue(true);

    const { status, data } = await readApiResponse<{ revoked: boolean }>(await request(DEVICE_ID));

    expect(status).toBe(200);
    expect(data?.revoked).toBe(true);
    expect(revokeDevice).toHaveBeenCalledWith("user-1", DEVICE_ID);
  });

  // The service scopes the write by userId, so this route cannot tell "not yours"
  // from "does not exist" — and should not be able to.
  it("answers 404 for a device that is not theirs", async () => {
    vi.mocked(revokeDevice).mockResolvedValue(false);

    const { status, error } = await readApiResponse(await request(DEVICE_ID));

    expect(status).toBe(404);
    expect(error?.code).toBe("RESOURCE_NOT_FOUND");
  });

  // The column is `uuid`. Left to the query, Postgres raises and the caller sees
  // a 500 where they should see a 404.
  it("answers 404 for a malformed id without reaching the database", async () => {
    const { status } = await readApiResponse(await request("not-a-uuid"));

    expect(status).toBe(404);
    expect(revokeDevice).not.toHaveBeenCalled();
  });

  it("refuses without a session", async () => {
    authenticateAsNobody();

    expect((await request(DEVICE_ID)).status).toBe(401);
  });
});
