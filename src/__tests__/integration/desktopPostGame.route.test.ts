import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/desktop/services/desktopPairingService", () => ({
  authenticateDevice: vi.fn(),
}));
vi.mock("@/domains/desktop/services/postGameService", () => ({
  requestPostGameSync: vi.fn(),
}));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/rateLimit")>()),
  checkRateLimit: vi.fn(),
}));

import type { DesktopDevice } from "@prisma/client";
import { POST as postGame } from "../../../app/api/desktop/post-game/route";
import { authenticateDevice } from "@/domains/desktop/services/desktopPairingService";
import { requestPostGameSync } from "@/domains/desktop/services/postGameService";
import { generateDeviceToken } from "@/domains/desktop/deviceToken";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { readApiResponse, routeRequest } from "@/test/apiRoute";

const TOKEN = generateDeviceToken();
const ACCOUNT_ID = "22222222-2222-2222-2222-222222222222";

const DEVICE: DesktopDevice = {
  id: "6f1b1f7a-0f7e-4a2b-9d1e-2c3a4b5c6d7e",
  userId: "user-1",
  token: TOKEN,
  label: "KAAN-PC",
  platform: "windows",
  appVersion: "0.1.0",
  createdAt: new Date("2026-08-23T12:00:00.000Z"),
  lastSeenAt: null,
  revokedAt: null,
};

function post(headers: Record<string, string> = { authorization: `Bearer ${TOKEN}` }) {
  return postGame(routeRequest("/api/desktop/post-game", { method: "POST", headers }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({
    allowed: true,
    retryAfterMs: 0,
    limit: 6,
    remaining: 5,
  });
  vi.mocked(authenticateDevice).mockResolvedValue({ device: DEVICE });
  vi.mocked(requestPostGameSync).mockResolvedValue({
    status: "pending",
    riotAccountId: ACCOUNT_ID,
  });
});

describe("POST /api/desktop/post-game", () => {
  it("asks for the device's account to be pulled", async () => {
    const res = await readApiResponse(await post());

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: "pending", riotAccountId: ACCOUNT_ID });
    expect(requestPostGameSync).toHaveBeenCalledWith(DEVICE);
  });

  // The route hands the whole device row over and adds nothing of its own. What game it
  // was is something the website reads from Riot, never something it takes on the word of
  // a client — so there is no body to be trusted or validated.
  it("takes nothing from the request but the token", async () => {
    await post();

    const [only] = vi.mocked(requestPostGameSync).mock.calls[0];
    expect(only).toBe(DEVICE);
    expect(vi.mocked(requestPostGameSync).mock.calls[0]).toHaveLength(1);
  });

  it("reports a sync already under way without pretending it started one", async () => {
    vi.mocked(requestPostGameSync).mockResolvedValue({
      status: "already_running",
      riotAccountId: ACCOUNT_ID,
    });

    expect((await readApiResponse(await post())).data).toEqual({
      status: "already_running",
      riotAccountId: ACCOUNT_ID,
    });
  });

  it("answers a null account id when there is no Riot account to pull", async () => {
    vi.mocked(requestPostGameSync).mockResolvedValue({ status: "no_riot_account" });

    const res = await readApiResponse(await post());
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: "no_riot_account", riotAccountId: null });
  });

  it("never lets the answer be cached", async () => {
    expect((await post()).headers.get("cache-control")).toBe("no-store");
  });
});

describe("POST /api/desktop/post-game refuses", () => {
  it("a request with no bearer token, without asking the database", async () => {
    expect((await readApiResponse(await post({}))).status).toBe(401);
    expect(authenticateDevice).not.toHaveBeenCalled();
    expect(requestPostGameSync).not.toHaveBeenCalled();
  });

  it("a token the website no longer accepts", async () => {
    vi.mocked(authenticateDevice).mockResolvedValue(null);

    expect((await readApiResponse(await post())).status).toBe(401);
    expect(requestPostGameSync).not.toHaveBeenCalled();
  });

  // The endpoint that writes is the one a stolen token would be pointed at in a loop. The
  // limit is keyed on the device and sized for games, not for polls.
  it("a device reporting more games than anyone plays", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterMs: 60_000,
      limit: 6,
      remaining: 0,
    });

    expect((await post()).status).toBe(429);
    expect(requestPostGameSync).not.toHaveBeenCalled();
  });

  it("keys the limit on the device rather than the account behind it", async () => {
    await post();
    const [key] = vi.mocked(checkRateLimit).mock.calls[0];
    expect(key).toContain(DEVICE.id);
  });
});
