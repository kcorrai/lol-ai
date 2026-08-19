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

import { NextResponse } from "next/server";
import {
  authenticateAs,
  authenticateAsNobody,
  readApiResponse,
  routeRequest,
} from "@/test/apiRoute";
import { Errors } from "@/lib/api/errors";
import { withAuth } from "./withAuth";

const handler = vi.fn(async () => NextResponse.json({ ok: true }));
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
