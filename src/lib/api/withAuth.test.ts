import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  withIsolationScope: (fn: (scope: { setTag: () => void }) => void) => fn({ setTag: () => {} }),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@/domains/desktop/services/desktopPairingService", () => ({
  authenticateDevice: vi.fn(),
}));

import { NextRequest, NextResponse } from "next/server";
import {
  authenticateAs,
  authenticateAsNobody,
  readApiResponse,
  routeRequest,
} from "@/test/apiRoute";
import { Errors } from "@/lib/api/errors";
import { authenticateDevice } from "@/domains/desktop/services/desktopPairingService";
import { withAuth } from "./withAuth";

// Typed with the context it receives, so the device-token tests below can assert what was
// handed to it — a bare `vi.fn(async () => …)` records no arguments to read back.
const handler = vi.fn(
  async (
    _req: NextRequest,
    _ctx: { userId: string; userEmail: string | null; requestId: string }
  ) => NextResponse.json({ ok: true })
);
const request = () => routeRequest("/api/anything");

beforeEach(() => {
  vi.resetAllMocks();
  handler.mockResolvedValue(NextResponse.json({ ok: true }));
});

describe("withAuth", () => {
  it("runs the handler for a fully authenticated session", async () => {
    authenticateAs({ id: "user-1", email: "a@b.test" });

    const res = await withAuth(handler)(request());

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("answers 401 with no session", async () => {
    authenticateAsNobody();

    const res = await withAuth(handler)(request());

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * The whole point of the second factor. 2FA used to be a setting that changed nothing
   * an attacker holding the password had to do, because a session existed the moment the
   * password checked out and every route accepted it.
   */
  it("refuses a session that still owes its second factor", async () => {
    authenticateAs({ id: "user-1", email: "a@b.test", twoFactorPending: true });

    const res = await withAuth(handler)(request());
    const body = await readApiResponse(res);

    expect(res.status).toBe(401);
    expect(body.error?.code).toBe("TWO_FACTOR_REQUIRED");
    expect(handler).not.toHaveBeenCalled();
  });

  // The challenge endpoint is the one thing such a session must be able to reach, or an
  // account with 2FA on could never finish logging in.
  it("lets an opted-in route serve a pending session", async () => {
    authenticateAs({ id: "user-1", email: "a@b.test", twoFactorPending: true });

    const res = await withAuth(handler, { allowTwoFactorPending: true })(request());

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("turns a thrown ApiError into its own status", async () => {
    authenticateAs({ id: "user-1" });
    handler.mockRejectedValue(Errors.validation("nope"));

    const res = await withAuth(handler)(request());

    expect(res.status).toBe(422);
    expect((await readApiResponse(res)).error?.code).toBe("VALIDATION_ERROR");
  });
});

/**
 * The desktop companion's half (ADR-043). It has no cookie jar, so it presents the device
 * token from the OS credential store — but only where the route has said it may.
 */
describe("withAuth, device token", () => {
  const TOKEN = "a".repeat(43); // the shape `readBearerToken` accepts
  const withToken = (token = TOKEN) =>
    routeRequest("/api/anything", { headers: { authorization: `Bearer ${token}` } });

  const devicePaired = () =>
    vi.mocked(authenticateDevice).mockResolvedValue({
      device: { id: "device-1", userId: "user-1" } as never,
    });

  it("serves an opted-in route for a paired device", async () => {
    authenticateAsNobody();
    devicePaired();

    const res = await withAuth(handler, { deviceAccess: true })(withToken());

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][1]).toMatchObject({ userId: "user-1", userEmail: null });
  });

  /**
   * The default, and the reason it is the default. Opting a route in is what makes the
   * blast radius of a stolen device token something anyone can read off the route file.
   */
  it("refuses the same token on a route that did not opt in", async () => {
    authenticateAsNobody();
    devicePaired();

    const res = await withAuth(handler)(withToken());

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
    // Not even asked. A route that never opted in should not be doing a database
    // lookup for every bearer token pointed at it.
    expect(authenticateDevice).not.toHaveBeenCalled();
  });

  it("refuses an unknown or revoked token", async () => {
    authenticateAsNobody();
    vi.mocked(authenticateDevice).mockResolvedValue(null);

    const res = await withAuth(handler, { deviceAccess: true })(withToken());
    const body = await readApiResponse(res);

    expect(res.status).toBe(401);
    // The same answer a route with no token gets, so walking the API with a bearer
    // token cannot be used to map which routes opted in.
    expect(body.error?.code).toBe("UNAUTHORIZED");
    expect(handler).not.toHaveBeenCalled();
  });

  it("costs a regex rather than a query for a malformed token", async () => {
    authenticateAsNobody();

    const res = await withAuth(handler, { deviceAccess: true })(withToken("too-short"));

    expect(res.status).toBe(401);
    expect(authenticateDevice).not.toHaveBeenCalled();
  });

  /**
   * A player signed in on this machine's browser is the stronger claim of the two, and
   * the one that carries an email and a second-factor state.
   */
  it("prefers the session when a request carries both", async () => {
    authenticateAs({ id: "session-user", email: "a@b.test" });
    devicePaired();

    const res = await withAuth(handler, { deviceAccess: true })(withToken());

    expect(res.status).toBe(200);
    expect(handler.mock.calls[0][1]).toMatchObject({
      userId: "session-user",
      userEmail: "a@b.test",
    });
    expect(authenticateDevice).not.toHaveBeenCalled();
  });
});
