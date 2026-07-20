import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth");
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/auth/authorization", () => ({
  assertOwnsRiotAccount: vi.fn(),
  assertCanGenerateReport: vi.fn(),
  getPlanLimits: vi.fn(),
}));
vi.mock("@/domains/coaching/services/reportService", () => ({
  createPendingReportWithinQuota: vi.fn(),
}));
vi.mock("@/domains/coaching/pipeline/dataPreparator", () => ({ buildCoachingInput: vi.fn() }));
vi.mock("@/domains/coaching/pipeline/coachingPipeline", () => ({ runCoachingPipeline: vi.fn() }));
vi.mock("@/lib/inngest/dispatch", () => ({ dispatchOrRunInProcess: vi.fn() }));
vi.mock("@/lib/audit/auditService", () => ({ audit: vi.fn() }));
vi.mock("@/lib/api/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkRateLimit: vi.fn(),
}));

import { assertCanGenerateReport, getPlanLimits } from "@/lib/auth/authorization";
import { createPendingReportWithinQuota } from "@/domains/coaching/services/reportService";
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
  vi.mocked(createPendingReportWithinQuota).mockResolvedValue("report-1");
  // The route calls .catch() on this — resetAllMocks strips the resolved value, so restore it here.
  vi.mocked(audit).mockResolvedValue(undefined);
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
    expect(createPendingReportWithinQuota).not.toHaveBeenCalled();
  });

  /**
   * The route delegates rather than orchestrating: quota enforcement and the insert are one
   * operation inside the service, so the handler cannot accidentally create a report without the
   * quota check (CLAUDE.md §2.2). Atomicity itself is covered in reportService.test.ts.
   */
  it("delegates creation to the quota-enforcing service", async () => {
    await generate();

    expect(createPendingReportWithinQuota).toHaveBeenCalledWith(
      USER_ID,
      VALID_BODY.riotAccountId,
      VALID_BODY.matchIds,
      VALID_BODY.reportType,
      undefined
    );
  });

  it("surfaces a quota rejection raised inside the service", async () => {
    vi.mocked(createPendingReportWithinQuota).mockRejectedValue(Errors.dailyReportLimitReached());

    const res = await generate();

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(429);
    expect(error?.code).toBe("DAILY_REPORT_LIMIT_REACHED");
  });

  // Preparation is the slow part; it must finish before the service takes the per-user lock, or the
  // lock would be held across it and serialize that user's requests for its whole duration.
  it("prepares the coaching input before creating the report", async () => {
    const order: string[] = [];
    vi.mocked(buildCoachingInput).mockImplementation(async () => {
      order.push("prepare");
      return {} as never;
    });
    vi.mocked(createPendingReportWithinQuota).mockImplementation(async () => {
      order.push("create");
      return "report-1";
    });

    await generate();

    expect(order).toEqual(["prepare", "create"]);
  });

  // The cheap pre-check exists so an over-quota user never pays for the expensive preparation.
  it("rejects over-quota users before doing the expensive preparation", async () => {
    vi.mocked(assertCanGenerateReport).mockRejectedValue(Errors.reportLimitReached());

    const res = await generate();

    expect(res.status).toBe(403);
    expect(buildCoachingInput).not.toHaveBeenCalled();
    expect(createPendingReportWithinQuota).not.toHaveBeenCalled();
  });

  it("rejects a body that fails schema validation", async () => {
    const res = await generate({ riotAccountId: "not-a-uuid", reportType: "session_review", matchIds: [] });

    const { status, error } = await readApiResponse(res);
    expect(status).toBe(422);
    expect(error?.code).toBe("VALIDATION_ERROR");
    expect(createPendingReportWithinQuota).not.toHaveBeenCalled();
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
    expect(createPendingReportWithinQuota).not.toHaveBeenCalled();
  });
});
