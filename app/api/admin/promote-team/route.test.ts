import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    subscription: { upsert: vi.fn() },
  },
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";
import { authenticateAs, authenticateAsNobody, readApiResponse, routeRequest } from "@/test/apiRoute";
import { POST } from "./route";

const ADMIN = "admin@lolai.test";
const TARGET = "player@lolai.test";
const CRON_SECRET = "cron-secret-value";
const PATH = "/api/admin/promote-team";

function promote(body: unknown = { email: TARGET }, headers?: Record<string, string>) {
  return POST(routeRequest(PATH, { method: "POST", body, headers }));
}

const originalAdmin = process.env.ADMIN_EMAIL;
const originalCron = process.env.CRON_SECRET;

beforeEach(() => {
  vi.resetAllMocks();
  process.env.ADMIN_EMAIL = ADMIN;
  process.env.CRON_SECRET = CRON_SECRET;
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never);
  vi.mocked(prisma.subscription.upsert).mockResolvedValue({} as never);
  authenticateAs({ id: "admin-1", email: ADMIN });
});

afterEach(() => {
  process.env.ADMIN_EMAIL = originalAdmin;
  process.env.CRON_SECRET = originalCron;
});

describe("POST /api/admin/promote-team", () => {
  it("grants the team plan for the admin session", async () => {
    const res = await promote();

    const { status, data } = await readApiResponse<{ email: string; plan: string }>(res);
    expect(status).toBe(200);
    expect(data).toEqual({ email: TARGET, plan: "team" });
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { plan: "team", status: "active" },
      })
    );
  });

  it("grants the team plan for the scheduler", async () => {
    authenticateAsNobody();

    const res = await promote({ email: TARGET }, { authorization: `Bearer ${CRON_SECRET}` });

    expect(res.status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenCalledOnce();
  });

  // This endpoint hands out a paid plan, so every rejection path matters.
  it("rejects a signed-in non-admin", async () => {
    authenticateAs({ id: "user-2", email: "someone@else.test" });

    const res = await promote();

    expect(res.status).toBe(403);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("rejects an anonymous request", async () => {
    authenticateAsNobody();

    const res = await promote();

    expect(res.status).toBe(403);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("rejects a wrong cron secret", async () => {
    authenticateAsNobody();

    const res = await promote({ email: TARGET }, { authorization: "Bearer wrong" });

    expect(res.status).toBe(403);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  // An unset ADMIN_EMAIL must not make every session an admin.
  it("fails closed when ADMIN_EMAIL is unset", async () => {
    delete process.env.ADMIN_EMAIL;

    const res = await promote();

    expect(res.status).toBe(403);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  // Likewise an unset CRON_SECRET must not let a bare "Bearer undefined" through.
  it("fails closed when CRON_SECRET is unset", async () => {
    delete process.env.CRON_SECRET;
    authenticateAsNobody();

    const res = await promote({ email: TARGET }, { authorization: "Bearer undefined" });

    expect(res.status).toBe(403);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("rejects a malformed JSON body instead of throwing", async () => {
    const res = await promote("{not json");

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(422);
    expect(error?.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a body whose email is not an email", async () => {
    const res = await promote({ email: "not-an-email" });

    expect(res.status).toBe(422);
    expect(prisma.subscription.upsert).not.toHaveBeenCalled();
  });

  it("reports an unknown user as not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await promote();

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(404);
    expect(error?.code).toBe("RESOURCE_NOT_FOUND");
  });

  it("does not leak the database error message on an unexpected failure", async () => {
    vi.mocked(prisma.subscription.upsert).mockRejectedValue(
      new Error('relation "subscriptions" does not exist at 10.0.0.4:5432')
    );

    const res = await promote();

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(500);
    expect(error?.message).not.toContain("subscriptions");
    expect(error?.message).not.toContain("10.0.0.4");
  });
});
