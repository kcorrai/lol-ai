import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    verificationToken: { findUnique: vi.fn(), delete: vi.fn() },
    user: { update: vi.fn() },
  },
}));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkRateLimit: vi.fn(),
}));

import { prisma } from "@/lib/db/prisma";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { routeRequest } from "@/test/apiRoute";
import { GET } from "./route";

const TOKEN = "verification-token-value";
const FUTURE = new Date(Date.now() + 3_600_000);
const PAST = new Date(Date.now() - 3_600_000);

function verify(token = TOKEN) {
  return GET(routeRequest("/api/auth/verify-email", { searchParams: { token } }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, limit: 10, remaining: 9 } as never);
  vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
    token: TOKEN,
    identifier: "player@lolai.test",
    expires: FUTURE,
  } as never);
  vi.mocked(prisma.verificationToken.delete).mockResolvedValue({} as never);
  vi.mocked(prisma.user.update).mockResolvedValue({} as never);
});

describe("GET /api/auth/verify-email", () => {
  it("verifies the user and consumes the token", async () => {
    const res = await verify();

    expect(res.headers.get("location")).toContain("email_verified=1");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "player@lolai.test" } })
    );
    expect(prisma.verificationToken.delete).toHaveBeenCalledWith({ where: { token: TOKEN } });
  });

  it("rejects an unknown token without verifying anyone", async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue(null);

    const res = await verify("nope");

    expect(res.headers.get("location")).toContain("email_error=invalid_token");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  // An expired token must be consumed, not left to be retried.
  it("rejects and deletes an expired token", async () => {
    vi.mocked(prisma.verificationToken.findUnique).mockResolvedValue({
      token: TOKEN,
      identifier: "player@lolai.test",
      expires: PAST,
    } as never);

    const res = await verify();

    expect(res.headers.get("location")).toContain("email_error=expired_token");
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.verificationToken.delete).toHaveBeenCalledOnce();
  });

  /**
   * This endpoint is unauthenticated and it writes. The limit is what stops an unmetered
   * lookup-by-token loop against the user table.
   */
  it("returns 429 without looking the token up when over the limit", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterMs: 30_000,
    } as never);

    const res = await verify();

    expect(res.status).toBe(429);
    expect(prisma.verificationToken.findUnique).not.toHaveBeenCalled();
  });
});
