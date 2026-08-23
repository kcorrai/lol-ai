import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { NextResponse } from "next/server";
import { authenticateAs, authenticateAsNobody, readApiResponse, routeRequest } from "@/test/apiRoute";
import { ApiError } from "@/lib/api/errors";
import { withAdminAuth } from "./withAdminAuth";

const ADMIN = "admin@lolai.test";

const handler = vi.fn(async () => NextResponse.json({ ok: true }));
const guarded = withAdminAuth(handler);

const request = () => routeRequest("/api/admin/anything");
const originalAdmin = process.env.ADMIN_EMAIL;

beforeEach(() => {
  vi.resetAllMocks();
  handler.mockResolvedValue(NextResponse.json({ ok: true }));
  process.env.ADMIN_EMAIL = ADMIN;
  authenticateAs({ id: "admin-1", email: ADMIN });
});

afterEach(() => {
  if (originalAdmin === undefined) delete process.env.ADMIN_EMAIL;
  else process.env.ADMIN_EMAIL = originalAdmin;
});

describe("withAdminAuth", () => {
  it("runs the handler for the configured admin", async () => {
    const res = await guarded(request());

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("passes the request through to the handler untouched", async () => {
    const req = request();

    await guarded(req);

    expect(handler).toHaveBeenCalledWith(req, expect.anything());
  });

  // Routes that record a decision need to name who made it, and the wrapper has
  // already resolved the session by this point — so it hands the identity over
  // rather than making the handler read the session a second time.
  it("hands the handler the admin's identity", async () => {
    await guarded(request());

    expect(handler).toHaveBeenCalledWith(expect.anything(), {
      adminId: "admin-1",
      adminEmail: ADMIN,
    });
  });

  /**
   * The order matters: an unset ADMIN_EMAIL is checked *before* the session, so a misconfigured
   * deployment blocks everyone rather than comparing every user's email against undefined.
   */
  it("blocks everyone when ADMIN_EMAIL is unset, without consulting the session", async () => {
    delete process.env.ADMIN_EMAIL;

    const res = await guarded(request());

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(403);
    expect(error?.message).toBe("Admin access not configured");
    expect(handler).not.toHaveBeenCalled();
  });

  it("treats an empty ADMIN_EMAIL as unset rather than matching an empty session email", async () => {
    process.env.ADMIN_EMAIL = "";

    const res = await guarded(request());

    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects an anonymous request", async () => {
    authenticateAsNobody();

    const res = await guarded(request());

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(401);
    expect(error?.code).toBe("UNAUTHORIZED");
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a signed-in user with no email", async () => {
    authenticateAs({ id: "user-2", email: null });

    const res = await guarded(request());

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a signed-in non-admin as forbidden, not unauthorized", async () => {
    authenticateAs({ id: "user-3", email: "someone@else.test" });

    const res = await guarded(request());

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(403);
    expect(error?.code).toBe("FORBIDDEN");
    expect(handler).not.toHaveBeenCalled();
  });

  // Email comparison is exact — no case folding, no trimming, no prefix matching.
  it.each([
    ["ADMIN@lolai.test", "different case"],
    [" admin@lolai.test", "leading whitespace"],
    ["admin@lolai.test.evil.com", "suffixed domain"],
    ["xadmin@lolai.test", "prefixed local part"],
  ])("rejects %s (%s)", async (email) => {
    authenticateAs({ id: "user-4", email });

    const res = await guarded(request());

    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  /**
   * The admin API is the one surface where a stolen password alone used to be
   * enough. Middleware turns a two-factor-pending session away from the `/admin`
   * pages, but every mutation is an API call, and this wrapper — unlike
   * `withAuth` — never looked at `twoFactorPending`. So an attacker holding the
   * admin's password could not load the dashboard and could still call every
   * route behind it.
   */
  it("rejects an admin who has passed the password but not the second factor", async () => {
    authenticateAs({ id: "admin-1", email: ADMIN, twoFactorPending: true });

    const res = await guarded(request());

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(401);
    expect(error?.code).toBe("TWO_FACTOR_REQUIRED");
    expect(handler).not.toHaveBeenCalled();
  });

  // The check is on the pending flag itself, not on 2FA being configured: an
  // admin who has answered the challenge is an ordinary admin again.
  it("admits an admin whose second factor is already answered", async () => {
    authenticateAs({ id: "admin-1", email: ADMIN, twoFactorPending: false });

    const res = await guarded(request());

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  /**
   * Admin handlers throw `ApiError` the same way authenticated ones do. Without
   * this they surfaced as 500s, so a validation failure on an admin route
   * answered "internal error" instead of saying what was wrong.
   */
  it("turns an ApiError from the handler into its own status", async () => {
    handler.mockRejectedValue(new ApiError("VALIDATION_ERROR", "A reason is required.", 422));

    const res = await guarded(request());

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(422);
    expect(error?.code).toBe("VALIDATION_ERROR");
    expect(error?.message).toBe("A reason is required.");
  });

  it("turns anything else into a 500 without leaking it", async () => {
    handler.mockRejectedValue(new Error("connection pool exhausted at 03:14"));

    const res = await guarded(request());

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(500);
    expect(error?.code).toBe("INTERNAL_ERROR");
    expect(error?.message).not.toMatch(/connection pool/);
  });
});
