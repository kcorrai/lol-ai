import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/desktop/services/desktopPairingService", () => ({
  authenticateDevice: vi.fn(),
  getDeviceAccount: vi.fn(),
}));
vi.mock("@/domains/desktop/services/liveContextService", () => ({
  getLiveContext: vi.fn(),
}));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/rateLimit")>()),
  checkRateLimit: vi.fn(),
}));

import type { DesktopDevice } from "@prisma/client";
import { POST as liveContext } from "../../../app/api/desktop/live-context/route";
import {
  authenticateDevice,
  getDeviceAccount,
} from "@/domains/desktop/services/desktopPairingService";
import { getLiveContext } from "@/domains/desktop/services/liveContextService";
import type { DesktopAccount } from "@/domains/desktop/contract";
import { generateDeviceToken } from "@/domains/desktop/deviceToken";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { readApiResponse, routeRequest } from "@/test/apiRoute";

const TOKEN = generateDeviceToken();
const RIOT_ACCOUNT_ID = "22222222-2222-2222-2222-222222222222";

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

const BODY = {
  championName: "Ahri",
  opponentChampionName: "Zed",
  position: "MIDDLE",
  gameMode: "CLASSIC",
};

const CONTEXT = {
  champion: { key: "Ahri", name: "Ahri" },
  opponent: { key: "Zed", name: "Zed" },
  personal: null,
  meta: null,
  habits: [],
  baseline: null,
  challenges: [],
  riotAccountLinked: true,
};

function post(
  body: unknown,
  headers: Record<string, string> = { authorization: `Bearer ${TOKEN}` }
) {
  return liveContext(routeRequest("/api/desktop/live-context", { body, headers }));
}

function account(riotAccount: DesktopAccount["riotAccount"]): DesktopAccount {
  return { userId: "user-1", email: "k@example.com", name: "Kaan", riotAccount };
}

const LINKED = account({
  id: RIOT_ACCOUNT_ID,
  gameName: "kaanproak0",
  tagLine: "TR1",
  region: "tr1",
  summonerLevel: 300,
  profileIconId: 12,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({
    allowed: true,
    retryAfterMs: 0,
    limit: 20,
    remaining: 19,
  });
  vi.mocked(authenticateDevice).mockResolvedValue({ device: DEVICE });
  vi.mocked(getDeviceAccount).mockResolvedValue(LINKED);
  vi.mocked(getLiveContext).mockResolvedValue(CONTEXT);
});

describe("POST /api/desktop/live-context", () => {
  it("answers the paired device with what the website knows", async () => {
    const res = await readApiResponse(await post(BODY));

    expect(res.status).toBe(200);
    expect(res.data).toEqual(CONTEXT);
    expect(getLiveContext).toHaveBeenCalledWith(RIOT_ACCOUNT_ID, "user-1", BODY);
  });

  it("never lets an answer about one account be cached", async () => {
    const res = await post(BODY);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("passes a null Riot account through rather than refusing", async () => {
    // A player can pair a machine before linking an account. That is a state with a
    // fix the app can name, not an error.
    vi.mocked(getDeviceAccount).mockResolvedValue(account(null));

    expect((await post(BODY)).status).toBe(200);
    expect(getLiveContext).toHaveBeenCalledWith(null, "user-1", BODY);
  });
});

describe("POST /api/desktop/live-context refuses", () => {
  it("a request with no bearer token, without asking the database", async () => {
    const res = await readApiResponse(await post(BODY, {}));

    expect(res.status).toBe(401);
    expect(authenticateDevice).not.toHaveBeenCalled();
    expect(getLiveContext).not.toHaveBeenCalled();
  });

  it("a token the website no longer accepts", async () => {
    vi.mocked(authenticateDevice).mockResolvedValue(null);

    expect((await readApiResponse(await post(BODY))).status).toBe(401);
    expect(getLiveContext).not.toHaveBeenCalled();
  });

  it("a device whose account has been deleted", async () => {
    vi.mocked(getDeviceAccount).mockResolvedValue(null);

    const res = await readApiResponse(await post(BODY));
    expect(res.status).toBe(401);
    expect(getLiveContext).not.toHaveBeenCalled();
  });

  it("a body that is not a game, before it reaches a service", async () => {
    const res = await readApiResponse(await post({ championName: "", gameMode: "CLASSIC" }));

    expect(res.status).toBe(422);
    expect(getLiveContext).not.toHaveBeenCalled();
  });

  it("a body that is not JSON at all", async () => {
    const res = await readApiResponse(
      await liveContext(
        routeRequest("/api/desktop/live-context", {
          body: "not json",
          headers: { authorization: `Bearer ${TOKEN}` },
        })
      )
    );

    expect(res.status).toBe(422);
  });

  it("a device asking far more often than a game starts", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterMs: 30_000,
      limit: 20,
      remaining: 0,
    });

    expect((await post(BODY)).status).toBe(429);
    expect(getLiveContext).not.toHaveBeenCalled();
  });
});

describe("POST /api/desktop/live-context accepts the shapes a live game really has", () => {
  it("no lane opponent and no position — every ARAM game", async () => {
    const aram = {
      championName: "Ahri",
      opponentChampionName: null,
      position: null,
      gameMode: "ARAM",
    };

    expect((await post(aram)).status).toBe(200);
    expect(getLiveContext).toHaveBeenCalledWith(RIOT_ACCOUNT_ID, "user-1", aram);
  });
});
