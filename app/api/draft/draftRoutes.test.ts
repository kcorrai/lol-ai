import { beforeEach, describe, expect, it, vi } from "vitest";
import { readApiResponse, routeRequest } from "@/test/apiRoute";
import type { DraftSeriesState } from "@/domains/draft";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));

vi.mock("@/lib/api/rateLimit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/rateLimit")>();
  return {
    ...actual,
    checkRateLimit: vi.fn(async () => ({
      allowed: true,
      retryAfterMs: 0,
      limit: 60,
      remaining: 59,
    })),
  };
});

vi.mock("@/domains/draft/server", () => ({
  createSeries: vi.fn(),
  getSeriesForGame: vi.fn(),
  setReady: vi.fn(),
  submitAction: vi.fn(),
  undoAction: vi.fn(),
  setGameResult: vi.fn(),
  setBlueTeam: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { checkRateLimit } from "@/lib/api/rateLimit";
import * as draft from "@/domains/draft/server";
import { POST as createRoute } from "./route";
import { GET as readRoute } from "./[code]/route";
import { POST as actionRoute } from "./[code]/action/route";
import { POST as readyRoute } from "./[code]/ready/route";
import { POST as undoRoute } from "./[code]/undo/route";
import { POST as resultRoute } from "./[code]/result/route";
import { POST as sideRoute } from "./[code]/side/route";

const CODE = "abcd2345";
const TOKEN = "a".repeat(32);
const params = { params: { code: CODE } };

const STATE = { code: CODE, games: [] } as unknown as DraftSeriesState;

function ok(role: "BLUE" | "RED" | "SPECTATOR" = "BLUE") {
  return { ok: true as const, state: STATE, role };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({
    allowed: true,
    retryAfterMs: 0,
    limit: 60,
    remaining: 59,
  });
  vi.mocked(getServerSession).mockResolvedValue(null as never);
  vi.mocked(draft.createSeries).mockResolvedValue({
    code: CODE,
    blueToken: TOKEN,
    redToken: "b".repeat(32),
  });
  vi.mocked(draft.getSeriesForGame).mockResolvedValue(ok("SPECTATOR"));
  vi.mocked(draft.submitAction).mockResolvedValue(ok());
  vi.mocked(draft.setReady).mockResolvedValue(ok());
  vi.mocked(draft.undoAction).mockResolvedValue(ok());
  vi.mocked(draft.setGameResult).mockResolvedValue(ok());
  vi.mocked(draft.setBlueTeam).mockResolvedValue(ok());
});

describe("POST /api/draft", () => {
  it("creates an anonymous series and returns all three links' secrets", async () => {
    const res = await createRoute(
      routeRequest("/api/draft", { body: { team1Name: "T1", team2Name: "T2" } })
    );
    const { status, data } = await readApiResponse<{ code: string; blueToken: string }>(res);

    expect(status).toBe(201);
    expect(data).toMatchObject({ code: CODE, blueToken: TOKEN });
    expect(draft.createSeries).toHaveBeenCalledWith(
      expect.objectContaining({ createdById: null, mode: "NORMAL", gameCount: 1 })
    );
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("records a signed-in creator without requiring one", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } } as never);
    await createRoute(routeRequest("/api/draft", { body: {} }));
    expect(draft.createSeries).toHaveBeenCalledWith(
      expect.objectContaining({ createdById: "user-1" })
    );
  });

  it("rejects a series longer than five games", async () => {
    const res = await createRoute(routeRequest("/api/draft", { body: { gameCount: 9 } }));
    const { status, error } = await readApiResponse(res);
    expect(status).toBe(422);
    expect(error?.code).toBe("VALIDATION_ERROR");
    expect(draft.createSeries).not.toHaveBeenCalled();
  });

  it("rejects a timer that would not leave a usable turn", async () => {
    const res = await createRoute(routeRequest("/api/draft", { body: { timerSeconds: 3 } }));
    expect((await readApiResponse(res)).status).toBe(422);
  });

  it("rejects a body that is not JSON", async () => {
    const res = await createRoute(routeRequest("/api/draft", { body: "not json at all" }));
    expect((await readApiResponse(res)).status).toBe(422);
  });

  it("answers 429 once the creation limit is spent", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterMs: 30_000,
      limit: 5,
      remaining: 0,
    });
    const res = await createRoute(routeRequest("/api/draft", { body: {} }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(draft.createSeries).not.toHaveBeenCalled();
  });
});

describe("GET /api/draft/[code]", () => {
  it("passes the requested game and token through", async () => {
    await readRoute(
      routeRequest(`/api/draft/${CODE}`, { searchParams: { game: "3", token: TOKEN } }),
      params
    );
    expect(draft.getSeriesForGame).toHaveBeenCalledWith(CODE, 3, TOKEN);
  });

  it("falls back to game 1 for a missing or nonsense game parameter", async () => {
    await readRoute(routeRequest(`/api/draft/${CODE}`), params);
    expect(draft.getSeriesForGame).toHaveBeenCalledWith(CODE, 1, null);

    await readRoute(
      routeRequest(`/api/draft/${CODE}`, { searchParams: { game: "banana" } }),
      params
    );
    expect(draft.getSeriesForGame).toHaveBeenLastCalledWith(CODE, 1, null);
  });

  it("returns the state and the caller's role, and never a token", async () => {
    const res = await readRoute(routeRequest(`/api/draft/${CODE}`), params);
    const { status, data } = await readApiResponse<{ role: string }>(res);
    expect(status).toBe(200);
    expect(data?.role).toBe("SPECTATOR");
    expect(JSON.stringify(data)).not.toContain(TOKEN);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("surfaces an unknown code as 404", async () => {
    vi.mocked(draft.getSeriesForGame).mockResolvedValue({
      ok: false,
      status: 404,
      reason: "not-found",
    });
    const { status, error } = await readApiResponse(
      await readRoute(routeRequest(`/api/draft/${CODE}`), params)
    );
    expect(status).toBe(404);
    expect(error?.code).toBe("RESOURCE_NOT_FOUND");
  });
});

describe("POST /api/draft/[code]/action", () => {
  const body = { token: TOKEN, gameNumber: 1, championKey: "Ahri" };

  it("locks a champion", async () => {
    const res = await actionRoute(routeRequest(`/api/draft/${CODE}/action`, { body }), params);
    expect((await readApiResponse(res)).status).toBe(200);
    expect(draft.submitAction).toHaveBeenCalledWith(CODE, 1, TOKEN, "Ahri");
  });

  it("accepts a passed ban", async () => {
    await actionRoute(
      routeRequest(`/api/draft/${CODE}/action`, { body: { ...body, championKey: null } }),
      params
    );
    expect(draft.submitAction).toHaveBeenCalledWith(CODE, 1, TOKEN, null);
  });

  it("carries the engine's reason through on a rejection", async () => {
    vi.mocked(draft.submitAction).mockResolvedValue({
      ok: false,
      status: 409,
      reason: "not-your-turn",
    });
    const { status, error } = await readApiResponse(
      await actionRoute(routeRequest(`/api/draft/${CODE}/action`, { body }), params)
    );
    expect(status).toBe(409);
    expect(error?.message).toBe("not-your-turn");
  });

  it("answers 403 when the caller holds no drafter token", async () => {
    vi.mocked(draft.submitAction).mockResolvedValue({
      ok: false,
      status: 403,
      reason: "not-a-drafter",
    });
    const { status, error } = await readApiResponse(
      await actionRoute(routeRequest(`/api/draft/${CODE}/action`, { body }), params)
    );
    expect(status).toBe(403);
    expect(error?.code).toBe("FORBIDDEN");
  });

  it("rejects a body with no token", async () => {
    const res = await actionRoute(
      routeRequest(`/api/draft/${CODE}/action`, { body: { gameNumber: 1, championKey: "Ahri" } }),
      params
    );
    expect((await readApiResponse(res)).status).toBe(422);
    expect(draft.submitAction).not.toHaveBeenCalled();
  });
});

describe("the remaining mutations delegate to the service", () => {
  it("ready", async () => {
    await readyRoute(
      routeRequest(`/api/draft/${CODE}/ready`, {
        body: { token: TOKEN, gameNumber: 2, ready: true },
      }),
      params
    );
    expect(draft.setReady).toHaveBeenCalledWith(CODE, 2, TOKEN, true);
  });

  it("undo", async () => {
    await undoRoute(
      routeRequest(`/api/draft/${CODE}/undo`, { body: { token: TOKEN, gameNumber: 1 } }),
      params
    );
    expect(draft.undoAction).toHaveBeenCalledWith(CODE, 1, TOKEN);
  });

  it("result", async () => {
    await resultRoute(
      routeRequest(`/api/draft/${CODE}/result`, {
        body: { token: TOKEN, gameNumber: 1, winnerSide: "RED" },
      }),
      params
    );
    expect(draft.setGameResult).toHaveBeenCalledWith(CODE, 1, TOKEN, "RED");
  });

  it("side", async () => {
    await sideRoute(
      routeRequest(`/api/draft/${CODE}/side`, {
        body: { token: TOKEN, gameNumber: 1, blueTeam: 2 },
      }),
      params
    );
    expect(draft.setBlueTeam).toHaveBeenCalledWith(CODE, 1, TOKEN, 2);
  });

  it("rejects a side that is neither team", async () => {
    const res = await sideRoute(
      routeRequest(`/api/draft/${CODE}/side`, {
        body: { token: TOKEN, gameNumber: 1, blueTeam: 3 },
      }),
      params
    );
    expect((await readApiResponse(res)).status).toBe(422);
    expect(draft.setBlueTeam).not.toHaveBeenCalled();
  });
});
