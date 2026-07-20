import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/auth/authorization", () => ({
  assertOwnsRiotAccount: vi.fn(),
  assertCanGenerateReport: vi.fn(),
  getPlanLimits: vi.fn(),
}));
vi.mock("@/lib/db/userLock", () => ({ withUserLock: vi.fn() }));
vi.mock("@/domains/coaching/services/reportService", () => ({ createPendingReport: vi.fn() }));
vi.mock("@/domains/coaching/pipeline/dataPreparator", () => ({ buildCoachingInput: vi.fn() }));
vi.mock("@/domains/coaching/pipeline/coachingPipeline", () => ({ runCoachingPipeline: vi.fn() }));
vi.mock("@/lib/inngest/dispatch", () => ({ dispatchOrRunInProcess: vi.fn() }));
vi.mock("@/lib/audit/auditService", () => ({ audit: vi.fn() }));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkRateLimit: vi.fn(),
}));

import { assertCanGenerateReport, getPlanLimits } from "@/lib/auth/authorization";
import { withUserLock } from "@/lib/db/userLock";
import { createPendingReport } from "@/domains/coaching/services/reportService";
import { buildCoachingInput } from "@/domains/coaching/pipeline/dataPreparator";
import { checkRateLimit } from "@/lib/api/rateLimit";
import { audit } from "@/lib/audit/auditService";
import { Errors } from "@/lib/api/errors";
import { authenticateAs, authenticateAsNobody, readApiResponse, routeRequest } from "@/test/apiRoute";
import { POST } from "./route";

const USER_ID = "user-1";
const PATH = "/api/coaching/generate";
// Real v4 UUIDs — zod v4's .uuid() enforces the RFC 4122 version and variant nibbles, so a
// plausible-looking string like "1111...-3333-4444-..." is rejected.
const VALID_BODY = {
  riotAccountId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  reportType: "session_review",
  matchIds: ["7c9e6679-7425-40de-944b-e07fc1f90ae7"],
};

function generate(body: unknown = VALID_BODY) {
  return POST(routeRequest(PATH, { method: "POST", body }));
}

beforeEach(() => {
  vi.resetAllMocks();
  authenticateAs({ id: USER_ID, email: "player@example.com" });
  vi.mocked(getPlanLimits).mockResolvedValue({ reportsPerDay: 1 } as never);
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, limit: 5, remaining: 4 } as never);
  vi.mocked(createPendingReport).mockResolvedValue("report-1");
  // The route calls .catch() on this — resetAllMocks strips the resolved value, so restore it here.
  vi.mocked(audit).mockResolvedValue(undefined);
  // Stand-in transaction client; the real one comes from Prisma.
  vi.mocked(withUserLock).mockImplementation(async (_userId, fn) => fn({} as never));
});

describe("POST /api/coaching/generate", () => {
  it("creates a pending report and reports it as accepted", async () => {
    const res = await generate();

    const { status, data } = await readApiResponse<{ reportId: string; status: string }>(res);
    expect(status).toBe(202);
    expect(data).toEqual({ reportId: "report-1", status: "pending" });
  });

  it("rejects an unauthenticated request", async () => {
    authenticateAsNobody();

    const res = await generate();

    expect(res.status).toBe(401);
    expect(createPendingReport).not.toHaveBeenCalled();
  });

  /**
   * The quota is the only ceiling on per-user AI spend, and each report is a paid LLM call. The
   * count and the insert must be atomic, otherwise concurrent requests each pass a stale count.
   */
  it("counts and inserts inside the same locked transaction", async () => {
    await generate();

    expect(withUserLock).toHaveBeenCalledOnce();
    expect(vi.mocked(withUserLock).mock.calls[0][0]).toBe(USER_ID);

    // Both the authoritative check and the insert received a transaction client, not the default.
    const tx = vi.mocked(assertCanGenerateReport).mock.calls.at(-1)?.[1];
    expect(tx).toBeDefined();
    expect(vi.mocked(createPendingReport).mock.calls[0][4]).toBe(tx);
  });

  it("does not insert when the quota check inside the lock rejects", async () => {
    // Passes the cheap pre-check, fails the authoritative one — the race this task closes.
    vi.mocked(assertCanGenerateReport)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(Errors.dailyReportLimitReached());

    const res = await generate();

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(429);
    expect(error?.code).toBe("DAILY_REPORT_LIMIT_REACHED");
    expect(createPendingReport).not.toHaveBeenCalled();
  });

  // Preparation is the slow part; holding the advisory lock across it would serialize a user's
  // requests for its whole duration.
  it("prepares the coaching input before taking the lock", async () => {
    const order: string[] = [];
    vi.mocked(buildCoachingInput).mockImplementation(async () => {
      order.push("prepare");
      return {} as never;
    });
    vi.mocked(withUserLock).mockImplementation(async (_userId, fn) => {
      order.push("lock");
      return fn({} as never);
    });

    await generate();

    expect(order).toEqual(["prepare", "lock"]);
  });

  it("rejects over-quota users before doing the expensive preparation", async () => {
    vi.mocked(assertCanGenerateReport).mockRejectedValue(Errors.reportLimitReached());

    const res = await generate();

    expect(res.status).toBe(403);
    expect(buildCoachingInput).not.toHaveBeenCalled();
    expect(withUserLock).not.toHaveBeenCalled();
  });

  it("rejects a body that fails schema validation", async () => {
    const res = await generate({ riotAccountId: "not-a-uuid", reportType: "session_review", matchIds: [] });

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(422);
    expect(error?.code).toBe("VALIDATION_ERROR");
    expect(createPendingReport).not.toHaveBeenCalled();
  });

  it("returns 429 when the hourly rate limit is exhausted", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 5,
      remaining: 0,
      retryAfterMs: 60_000,
    } as never);

    const res = await generate();

    expect(res.status).toBe(429);
    expect(createPendingReport).not.toHaveBeenCalled();
  });
});
