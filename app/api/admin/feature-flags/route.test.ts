import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    featureFlag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db/prisma";
import { authenticateAs, authenticateAsNobody, routeRequest } from "@/test/apiRoute";
import { GET, POST, PATCH, DELETE } from "./route";

const ADMIN = "admin@lolai.test";
const PATH = "/api/admin/feature-flags";
const FLAG_ID = "11111111-1111-4111-8111-111111111111";

const originalAdmin = process.env.ADMIN_EMAIL;

beforeEach(() => {
  vi.resetAllMocks();
  process.env.ADMIN_EMAIL = ADMIN;
  vi.mocked(prisma.featureFlag.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({ id: FLAG_ID } as never);
  vi.mocked(prisma.featureFlag.create).mockResolvedValue({ id: FLAG_ID } as never);
  vi.mocked(prisma.featureFlag.updateMany).mockResolvedValue({ count: 1 } as never);
  vi.mocked(prisma.featureFlag.deleteMany).mockResolvedValue({ count: 1 } as never);
  authenticateAs({ id: "admin-1", email: ADMIN });
});

afterEach(() => {
  if (originalAdmin === undefined) delete process.env.ADMIN_EMAIL;
  else process.env.ADMIN_EMAIL = originalAdmin;
});

/**
 * This route rolls its own admin check rather than going through `withAdminAuth`,
 * which is exactly why it needs its own tests: every guarantee the wrapper gives
 * has to be re-established here by hand, and a gap in one is invisible from the other.
 */
describe("/api/admin/feature-flags — authorization", () => {
  const calls = {
    GET: () => GET(),
    POST: () => POST(routeRequest(PATH, { method: "POST", body: { key: "new_flag" } })),
    PATCH: () =>
      PATCH(routeRequest(PATH, { method: "PATCH", body: { id: FLAG_ID, enabled: true } })),
    DELETE: () => DELETE(routeRequest(PATH, { method: "DELETE", searchParams: { id: FLAG_ID } })),
  } as const;

  const methods = Object.keys(calls) as (keyof typeof calls)[];

  it.each(methods)("%s refuses an anonymous caller", async (method) => {
    authenticateAsNobody();

    const res = await calls[method]();

    expect(res.status).toBe(403);
  });

  it.each(methods)("%s refuses a signed-in non-admin", async (method) => {
    authenticateAs({ id: "user-2", email: "someone@else.test" });

    const res = await calls[method]();

    expect(res.status).toBe(403);
  });

  /**
   * A password alone must not edit feature flags. Middleware keeps a
   * two-factor-pending session off the `/admin` pages, but these handlers are
   * reachable directly — so the flag has to be checked here too, the same way
   * `withAdminAuth` checks it for every other admin route.
   */
  it.each(methods)("%s refuses an admin who still owes a second factor", async (method) => {
    authenticateAs({ id: "admin-1", email: ADMIN, twoFactorPending: true });

    const res = await calls[method]();

    expect(res.status).toBe(403);
    expect(prisma.featureFlag.create).not.toHaveBeenCalled();
    expect(prisma.featureFlag.updateMany).not.toHaveBeenCalled();
    expect(prisma.featureFlag.deleteMany).not.toHaveBeenCalled();
  });

  it.each(methods)("%s refuses everyone when ADMIN_EMAIL is unset", async (method) => {
    delete process.env.ADMIN_EMAIL;

    const res = await calls[method]();

    expect(res.status).toBe(403);
  });
});

describe("/api/admin/feature-flags — behaviour for the admin", () => {
  it("lists flags newest first", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(prisma.featureFlag.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("rejects a key that is not lower snake case", async () => {
    const res = await POST(routeRequest(PATH, { method: "POST", body: { key: "Not Valid" } }));

    expect(res.status).toBe(422);
    expect(prisma.featureFlag.create).not.toHaveBeenCalled();
  });

  it("creates a flag with the documented defaults", async () => {
    const res = await POST(routeRequest(PATH, { method: "POST", body: { key: "new_flag" } }));

    expect(res.status).toBe(201);
    expect(prisma.featureFlag.create).toHaveBeenCalledWith({
      data: {
        key: "new_flag",
        description: "",
        enabled: false,
        rolloutPercentage: 100,
        userSegment: ["all"],
      },
    });
  });

  it("rejects a rollout percentage outside 0–100", async () => {
    const res = await POST(
      routeRequest(PATH, { method: "POST", body: { key: "new_flag", rolloutPercentage: 101 } })
    );

    expect(res.status).toBe(422);
  });

  // `updateMany` reports a count instead of throwing, which is what lets this
  // answer "not found" rather than "internal error" for a flag another admin
  // had just removed.
  it("answers 404 when updating a flag that is gone", async () => {
    vi.mocked(prisma.featureFlag.updateMany).mockResolvedValue({ count: 0 } as never);

    const res = await PATCH(
      routeRequest(PATH, { method: "PATCH", body: { id: FLAG_ID, enabled: true } })
    );

    expect(res.status).toBe(404);
  });

  it("answers 404 when deleting a flag that is gone", async () => {
    vi.mocked(prisma.featureFlag.deleteMany).mockResolvedValue({ count: 0 } as never);

    const res = await DELETE(
      routeRequest(PATH, { method: "DELETE", searchParams: { id: FLAG_ID } })
    );

    expect(res.status).toBe(404);
  });

  it("requires an id to delete", async () => {
    const res = await DELETE(routeRequest(PATH, { method: "DELETE" }));

    expect(res.status).toBe(400);
    expect(prisma.featureFlag.deleteMany).not.toHaveBeenCalled();
  });
});
