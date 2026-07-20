import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/domains/coaching/services/weeklyReportService", () => ({
  sendWeeklyReports: vi.fn(),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { sendWeeklyReports } from "@/domains/coaching/services/weeklyReportService";
import { routeRequest } from "@/test/apiRoute";
import { GET } from "./route";

const SECRET = "cron-secret-value";

function cronRequest(authorization?: string) {
  return routeRequest("/api/cron/weekly-report", {
    headers: authorization ? { authorization } : {},
  });
}

const originalSecret = process.env.CRON_SECRET;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sendWeeklyReports).mockResolvedValue({ sent: 3, skipped: 1 } as never);
  process.env.CRON_SECRET = SECRET;
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalSecret;
});

describe("GET /api/cron/weekly-report", () => {
  it("runs the weekly send for a correctly authorized cron request", async () => {
    const res = await GET(cronRequest(`Bearer ${SECRET}`));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, sent: 3, skipped: 1 });
    expect(sendWeeklyReports).toHaveBeenCalledTimes(1);
  });

  // This endpoint triggers a mass email send, so an unset secret must fail closed rather than
  // degrade into an open endpoint.
  it("refuses to run when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const res = await GET(cronRequest(`Bearer ${SECRET}`));

    expect(res.status).toBe(500);
    expect(sendWeeklyReports).not.toHaveBeenCalled();
  });

  it("rejects a request with no authorization header", async () => {
    const res = await GET(cronRequest());

    expect(res.status).toBe(401);
    expect(sendWeeklyReports).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret", async () => {
    const res = await GET(cronRequest("Bearer not-the-secret"));

    expect(res.status).toBe(401);
    expect(sendWeeklyReports).not.toHaveBeenCalled();
  });

  // The comparison is against the full `Bearer <secret>` string; a bare secret must not pass.
  it("rejects the secret without the Bearer scheme", async () => {
    const res = await GET(cronRequest(SECRET));

    expect(res.status).toBe(401);
    expect(sendWeeklyReports).not.toHaveBeenCalled();
  });
});
