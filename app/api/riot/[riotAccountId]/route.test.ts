import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/auth/authorization", () => ({
  assertOwnsRiotAccount: vi.fn(),
  assertCanDisconnectRiotAccount: vi.fn(),
}));
vi.mock("@/domains/riot/services/accountService", () => ({
  setPrimaryAccount: vi.fn(),
  disconnectAccount: vi.fn(),
}));

import { assertOwnsRiotAccount, assertCanDisconnectRiotAccount } from "@/lib/auth/authorization";
import { setPrimaryAccount, disconnectAccount } from "@/domains/riot/services/accountService";
import { Errors } from "@/lib/api/errors";
import {
  authenticateAs,
  authenticateAsNobody,
  readApiResponse,
  routeRequest,
} from "@/test/apiRoute";
import { PATCH, DELETE } from "./route";

const USER_ID = "user-1";
const ACCOUNT_ID = "acc-1";
const PATH = `/api/riot/${ACCOUNT_ID}`;

beforeEach(() => {
  // mockReset, not clearAllMocks — clearAllMocks leaves queued `mockResolvedValueOnce` values
  // behind, which leak across tests (learned in TASK-265).
  vi.resetAllMocks();
  authenticateAs({ id: USER_ID, email: "player@example.com" });
});

describe("PATCH /api/riot/[riotAccountId]", () => {
  it("rejects an unauthenticated request before touching the account", async () => {
    authenticateAsNobody();

    const res = await PATCH(
      routeRequest(PATH, { method: "PATCH", body: { action: "set_primary" } })
    );

    expect(res.status).toBe(401);
    expect(assertOwnsRiotAccount).not.toHaveBeenCalled();
    expect(setPrimaryAccount).not.toHaveBeenCalled();
  });

  it("sets the account primary for the authenticated user", async () => {
    const res = await PATCH(
      routeRequest(PATH, { method: "PATCH", body: { action: "set_primary" } })
    );

    const { status, data } = await readApiResponse<{ primary: boolean }>(res);
    expect(status).toBe(200);
    expect(data).toEqual({ primary: true });
    expect(setPrimaryAccount).toHaveBeenCalledWith(USER_ID, ACCOUNT_ID);
  });

  // The account id comes from the URL path, so the ownership check is the only thing standing
  // between a session and someone else's account.
  it("checks ownership before mutating", async () => {
    vi.mocked(assertOwnsRiotAccount).mockRejectedValue(Errors.riotAccountNotOwned());

    const res = await PATCH(
      routeRequest(PATH, { method: "PATCH", body: { action: "set_primary" } })
    );

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(403);
    expect(error?.code).toBe("RIOT_ACCOUNT_NOT_OWNED");
    expect(setPrimaryAccount).not.toHaveBeenCalled();
  });

  it("scopes the ownership check to the session user, not the requested id alone", async () => {
    await PATCH(routeRequest(PATH, { method: "PATCH", body: { action: "set_primary" } }));

    expect(assertOwnsRiotAccount).toHaveBeenCalledWith(USER_ID, ACCOUNT_ID);
  });

  it("rejects a body with an unknown action", async () => {
    const res = await PATCH(
      routeRequest(PATH, { method: "PATCH", body: { action: "delete_all" } })
    );

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(422);
    expect(error?.code).toBe("VALIDATION_ERROR");
    expect(setPrimaryAccount).not.toHaveBeenCalled();
  });

  it("rejects a malformed JSON body", async () => {
    const res = await PATCH(routeRequest(PATH, { method: "PATCH", body: "{not json" }));

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(422);
    expect(error?.message).toBe("Invalid JSON body");
  });

  it("returns 500 without leaking the message when the service fails unexpectedly", async () => {
    vi.mocked(setPrimaryAccount).mockRejectedValue(
      new Error("connection string: postgres://secret")
    );

    const res = await PATCH(
      routeRequest(PATH, { method: "PATCH", body: { action: "set_primary" } })
    );

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(500);
    expect(error?.code).toBe("INTERNAL_ERROR");
    expect(error?.message).not.toContain("postgres://");
  });
});

describe("DELETE /api/riot/[riotAccountId]", () => {
  it("disconnects the account", async () => {
    const res = await DELETE(routeRequest(PATH, { method: "DELETE" }));

    const { status, data } = await readApiResponse<{ disconnected: boolean }>(res);
    expect(status).toBe(200);
    expect(data).toEqual({ disconnected: true });
    expect(disconnectAccount).toHaveBeenCalledWith(USER_ID, ACCOUNT_ID);
  });

  // Free-plan users cannot disconnect; this must be decided before ownership is even considered,
  // otherwise the plan gate is reachable only for accounts the user already owns.
  it("enforces the plan gate before disconnecting", async () => {
    vi.mocked(assertCanDisconnectRiotAccount).mockRejectedValue(
      Errors.cannotDisconnectOnFreePlan()
    );

    const res = await DELETE(routeRequest(PATH, { method: "DELETE" }));

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(403);
    expect(error?.code).toBe("CANNOT_DISCONNECT_FREE_PLAN");
    expect(disconnectAccount).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request", async () => {
    authenticateAsNobody();

    const res = await DELETE(routeRequest(PATH, { method: "DELETE" }));

    expect(res.status).toBe(401);
    expect(disconnectAccount).not.toHaveBeenCalled();
  });
});
