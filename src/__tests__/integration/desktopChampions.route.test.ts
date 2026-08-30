import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/desktop/services/desktopPairingService", () => ({
  authenticateDevice: vi.fn(),
  getDeviceAccount: vi.fn(),
}));
vi.mock("@/domains/desktop/services/championBrowserService", () => ({
  listChampions: vi.fn(),
  readChampion: vi.fn(),
}));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/rateLimit")>()),
  checkRateLimit: vi.fn(),
}));

import type { DesktopDevice } from "@prisma/client";
import { GET as champions } from "../../../app/api/desktop/champions/route";
import { GET as champion } from "../../../app/api/desktop/champions/[key]/route";
import { listChampions, readChampion } from "@/domains/desktop/services/championBrowserService";
import type { DesktopChampion, DesktopChampionList } from "@/domains/desktop/championsContract";
import { authenticateDevice } from "@/domains/desktop/services/desktopPairingService";
import { generateDeviceToken } from "@/domains/desktop/deviceToken";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { readApiResponse, routeRequest } from "@/test/apiRoute";

const TOKEN = generateDeviceToken();
const AUTH = { authorization: `Bearer ${TOKEN}` };

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

const LIST: DesktopChampionList = {
  position: "MIDDLE",
  patch: "26.16",
  entries: [
    {
      championKey: "Ahri",
      name: "Ahri",
      tier: 1,
      rank: 3,
      winRate: 51.2,
      pickRate: 8.4,
      banRate: 3.1,
      games: 91_204,
      lowConfidence: false,
    },
  ],
};

const CHAMPION: DesktopChampion = {
  champion: { key: "Ahri", name: "Ahri" },
  position: "MIDDLE",
  patch: "26.16",
  availablePositions: ["MIDDLE"],
  stats: { games: 91_204, winRate: 51.2, pickRate: 8.4, banRate: 3.1, tier: 1 },
  build: null,
  title: "the Nine-Tailed Fox",
  tags: ["Mage", "Assassin"],
  abilities: [],
  counteredBy: [{ championKey: "Zed", name: "Zed", games: 4210, subjectWinRate: 47.5 }],
  goodInto: [{ championKey: "Lux", name: "Lux", games: 3100, subjectWinRate: 53.8 }],
};

function list(searchParams: Record<string, string>, headers: Record<string, string> = AUTH) {
  return champions(routeRequest("/api/desktop/champions", { searchParams, headers }));
}

function detail(
  key: string,
  searchParams: Record<string, string>,
  headers: Record<string, string> = AUTH
) {
  return champion(routeRequest(`/api/desktop/champions/${key}`, { searchParams, headers }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({
    allowed: true,
    retryAfterMs: 0,
    limit: 120,
    remaining: 119,
  });
  vi.mocked(authenticateDevice).mockResolvedValue({ device: DEVICE });
  vi.mocked(listChampions).mockResolvedValue(LIST);
  vi.mocked(readChampion).mockResolvedValue(CHAMPION);
});

describe("GET /api/desktop/champions", () => {
  it("answers the paired device with the lane it asked for", async () => {
    const res = await readApiResponse(await list({ role: "mid" }));

    expect(res.status).toBe(200);
    expect(res.data).toEqual(LIST);
    // The lane is canonicalised before it reaches the service, so "mid" and "MIDDLE"
    // cannot become two different cache keys upstream.
    expect(listChampions).toHaveBeenCalledWith("MIDDLE");
  });

  it("refuses a lane it cannot name, without asking the service", async () => {
    const res = await readApiResponse(await list({ role: "jungler" }));

    expect(res.status).toBe(422);
    expect(listChampions).not.toHaveBeenCalled();
  });

  it("says the snapshot is unavailable rather than answering with no champions", async () => {
    // An empty lane and an unreachable feed are different states: one is an answer and
    // the other is worth retrying.
    vi.mocked(listChampions).mockResolvedValue(null);

    expect((await list({ role: "mid" })).status).toBe(503);
  });

  it("a request with no bearer token, without asking the database", async () => {
    const res = await readApiResponse(await list({ role: "mid" }, {}));

    expect(res.status).toBe(401);
    expect(authenticateDevice).not.toHaveBeenCalled();
    expect(listChampions).not.toHaveBeenCalled();
  });

  it("a device that has been cut off", async () => {
    vi.mocked(authenticateDevice).mockResolvedValue(null);

    expect((await list({ role: "mid" })).status).toBe(401);
    expect(listChampions).not.toHaveBeenCalled();
  });

  it("a device browsing in a loop", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterMs: 30_000,
      limit: 120,
      remaining: 0,
    });

    expect((await list({ role: "mid" })).status).toBe(429);
    expect(listChampions).not.toHaveBeenCalled();
  });
});

describe("GET /api/desktop/champions/[key]", () => {
  it("reads the champion out of the path and the lane out of the query", async () => {
    const res = await readApiResponse(await detail("Ahri", { role: "mid" }));

    expect(res.status).toBe(200);
    expect(res.data).toEqual(CHAMPION);
    expect(readChampion).toHaveBeenCalledWith("Ahri", "MIDDLE");
  });

  it("takes the ids that look like they carry punctuation but do not", async () => {
    // The punctuation lives in the display name, never in the id: "Nunu & Willump" is
    // `Nunu`, "Dr. Mundo" is `DrMundo`, "Wukong" is `MonkeyKing`. A filter written for the
    // names rather than the ids would make these champions unreachable.
    for (const key of ["Nunu", "DrMundo", "MonkeyKing", "KSante"]) {
      await detail(key, { role: "top" });
      expect(readChampion).toHaveBeenCalledWith(key, "TOP");
    }
  });

  it.each(["../../secrets", "Ahri; drop", "a b", "Ahri!", ""])(
    "refuses %j, which could not be a champion id, without asking the service",
    async (key) => {
      await expect(
        readApiResponse(await detail(encodeURIComponent(key), { role: "mid" }))
      ).resolves.toMatchObject({ status: 422 });
      expect(readChampion).not.toHaveBeenCalled();
    }
  );

  it("answers 404 for a champion the patch has no reading for", async () => {
    // One answer for an unknown id and for a known champion the snapshot omits: the app
    // can act on neither.
    vi.mocked(readChampion).mockResolvedValue(null);

    expect((await detail("Ahri", { role: "mid" })).status).toBe(404);
  });

  it("never lets an answer be cached between here and the machine that asked", async () => {
    expect((await detail("Ahri", { role: "mid" })).headers.get("cache-control")).toBe("no-store");
  });
});
