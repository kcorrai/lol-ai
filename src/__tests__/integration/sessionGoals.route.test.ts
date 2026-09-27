import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// The route's contract only (CLAUDE.md 2.2): it validates, delegates to the
// marketplace domain and turns each outcome into one HTTP answer.
vi.mock("@/domains/marketplace", () => ({
  goalProgress: vi.fn(),
  setGoals: vi.fn(),
  MAX_GOALS: 3,
}));
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ authOptions: {} }));
vi.mock("@/lib/utils/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, PUT } from "@/../app/api/bookings/[bookingId]/goals/route";
import { goalProgress, setGoals } from "@/domains/marketplace";
import { getServerSession } from "next-auth";

const mockProgress = vi.mocked(goalProgress);
const mockSet = vi.mocked(setGoals);
const mockSession = getServerSession as unknown as ReturnType<typeof vi.fn>;
const ctx = { params: { bookingId: "b-1" } };

function put(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/bookings/b-1/goals", {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue({ user: { id: "user-1" } });
});

describe("GET /api/bookings/[bookingId]/goals", () => {
  it("returns the progress for someone on the booking", async () => {
    mockProgress.mockResolvedValue({ goals: [], tracked: true, games: [], window: 10 });

    const res = await GET(new NextRequest("http://localhost/api/bookings/b-1/goals"), ctx);

    expect(res.status).toBe(200);
    expect(mockProgress).toHaveBeenCalledWith("b-1", "user-1");
  });

  it("answers 404 for anyone else", async () => {
    mockProgress.mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost/api/bookings/b-1/goals"), ctx);
    expect(res.status).toBe(404);
  });

  it("refuses a signed-out reader", async () => {
    mockSession.mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost/api/bookings/b-1/goals"), ctx);
    expect(res.status).toBe(401);
  });
});

describe("PUT /api/bookings/[bookingId]/goals", () => {
  it("passes valid goals to the domain", async () => {
    mockSet.mockResolvedValue({ ok: true });

    const res = await PUT(put({ goals: [{ metric: "KDA", target: 3 }] }), ctx);

    expect(res.status).toBe(200);
    expect(mockSet).toHaveBeenCalledWith("b-1", "user-1", [{ metric: "KDA", target: 3 }]);
  });

  it("rejects a body that is not a list of goals before delegating", async () => {
    const res = await PUT(put({ goals: [{ metric: "GOLD", target: 3 }] }), ctx);

    expect(res.status).toBe(422);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it.each([
    ["not-found", 404],
    ["not-open", 409],
    ["invalid", 422],
  ] as const)("maps %s to %i", async (reason, status) => {
    mockSet.mockResolvedValue({ ok: false, reason });

    const res = await PUT(put({ goals: [] }), ctx);
    expect(res.status).toBe(status);
  });
});
