import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/auth/authorization", () => ({ assertOwnsRiotAccount: vi.fn() }));
vi.mock("@/domains/riot/services/syncFreshness", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  requestSyncIfStale: vi.fn(),
}));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkRateLimit: vi.fn(),
}));

import { assertOwnsRiotAccount } from "@/lib/auth/authorization";
import {
  requestSyncIfStale,
  SYNC_ATTEMPT_COOLDOWN_MS,
} from "@/domains/riot/services/syncFreshness";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { authenticateAs, readApiResponse, routeRequest } from "@/test/apiRoute";
import { POST } from "./route";

const PATH = "/api/riot/acc-1/sync";
const post = () => POST(routeRequest(PATH, { method: "POST" }));

beforeEach(() => {
  vi.resetAllMocks();
  authenticateAs({ id: "user-1" });
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, limit: 30, remaining: 29 } as never);
});

describe("POST /api/riot/[riotAccountId]/sync", () => {
  it("checks ownership, then asks for a sync with the attempt cooldown", async () => {
    vi.mocked(requestSyncIfStale).mockResolvedValue({ requested: true });

    const res = await readApiResponse(await post());

    expect(assertOwnsRiotAccount).toHaveBeenCalledWith("user-1", "acc-1");
    expect(vi.mocked(requestSyncIfStale).mock.calls[0]?.[3]).toBe(SYNC_ATTEMPT_COOLDOWN_MS);
    expect(res).toMatchObject({ status: 202, data: { status: "pending", riotAccountId: "acc-1" } });
  });

  it("reports the current status instead of starting a second sync", async () => {
    vi.mocked(requestSyncIfStale).mockResolvedValue({
      requested: false,
      reason: "recent",
      status: "FAILED",
    });

    const res = await readApiResponse(await post());

    expect(res).toMatchObject({ status: 202, data: { status: "FAILED" } });
  });

  it("answers 404 for an account that is gone", async () => {
    vi.mocked(requestSyncIfStale).mockResolvedValue({ requested: false, reason: "missing" });

    expect((await readApiResponse(await post())).status).toBe(404);
  });

  it("refuses before touching the account when over the per-user limit", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfterMs: 60_000,
      limit: 30,
      remaining: 0,
    });

    expect((await post()).status).toBe(429);
    expect(requestSyncIfStale).not.toHaveBeenCalled();
  });
});
