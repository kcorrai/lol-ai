import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// The route's job is to validate, delegate and respond (CLAUDE.md 2.2), so the
// service is mocked and what is under test is exactly that: which status a
// given outcome turns into, and what reaches the service.
vi.mock("@/domains/esports", () => ({
  followTeam: vi.fn(),
  listFollows: vi.fn(),
  unfollowTeam: vi.fn(),
  MAX_FOLLOWS: 20,
}));

vi.mock("@/lib/api/withAuth", () => ({
  withAuth:
    (handler: (req: NextRequest, ctx: { userId: string }) => Promise<Response>) =>
    async (req: NextRequest) => {
      try {
        return await handler(req, { userId: "user-1" });
      } catch (err) {
        const { ApiError } = await import("@/lib/api/errors");
        if (err instanceof ApiError) {
          return Response.json({ error: { code: err.code } }, { status: err.statusCode });
        }
        throw err;
      }
    },
}));

import { GET, POST } from "@/../app/api/esports/follows/route";
import { DELETE } from "@/../app/api/esports/follows/[teamId]/route";
import { followTeam, listFollows, unfollowTeam } from "@/domains/esports";

const mockFollow = followTeam as unknown as ReturnType<typeof vi.fn>;
const mockList = listFollows as unknown as ReturnType<typeof vi.fn>;
const mockUnfollow = unfollowTeam as unknown as ReturnType<typeof vi.fn>;

const ENTRY = {
  teamId: "98767991866488695",
  name: "Fnatic",
  slug: "fnatic",
  followedAt: "2026-08-17T09:00:00.000Z",
};

function post(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/esports/follows", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/esports/follows", () => {
  it("returns the reader's follows and the limit the UI has to respect", async () => {
    mockList.mockResolvedValue([ENTRY]);

    const res = await GET(new NextRequest("http://localhost/api/esports/follows"));
    const body = (await res.json()) as { data: { follows: unknown[]; limit: number } };

    expect(res.status).toBe(200);
    expect(body.data.follows).toEqual([ENTRY]);
    expect(body.data.limit).toBe(20);
    expect(mockList).toHaveBeenCalledWith("user-1");
  });
});

describe("POST /api/esports/follows", () => {
  it("follows the team and answers with the stored entry", async () => {
    mockFollow.mockResolvedValue({ ok: true, entry: ENTRY });

    const res = await POST(post({ slug: "fnatic" }));

    expect(res.status).toBe(200);
    // The user id comes from the session, never from the body.
    expect(mockFollow).toHaveBeenCalledWith("user-1", "fnatic");
  });

  it("422s a body with no slug rather than reaching the service", async () => {
    const res = await POST(post({}));

    expect(res.status).toBe(422);
    expect(mockFollow).not.toHaveBeenCalled();
  });

  it("422s a body that is not JSON at all", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/esports/follows", { method: "POST", body: "not json" })
    );

    expect(res.status).toBe(422);
    expect(mockFollow).not.toHaveBeenCalled();
  });

  it("404s a team the feed does not publish", async () => {
    mockFollow.mockResolvedValue({ ok: false, reason: "unknown-team" });

    expect((await POST(post({ slug: "nope" }))).status).toBe(404);
  });

  it("403s at the follow limit, which is a refusal rather than a bad request", async () => {
    mockFollow.mockResolvedValue({ ok: false, reason: "limit-reached" });

    expect((await POST(post({ slug: "fnatic" }))).status).toBe(403);
  });
});

describe("DELETE /api/esports/follows/[teamId]", () => {
  it("unfollows and reports that a row went", async () => {
    mockUnfollow.mockResolvedValue(true);

    const res = await DELETE(
      new NextRequest("http://localhost/api/esports/follows/t1", { method: "DELETE" }),
      { params: { teamId: "t1" } }
    );
    const body = (await res.json()) as { data: { removed: boolean } };

    expect(res.status).toBe(200);
    expect(body.data.removed).toBe(true);
    expect(mockUnfollow).toHaveBeenCalledWith("user-1", "t1");
  });

  it("still answers 200 when there was nothing to remove", async () => {
    // The reader wanted it gone and it is gone. A 404 here would make a
    // double-click look like a failure.
    mockUnfollow.mockResolvedValue(false);

    const res = await DELETE(
      new NextRequest("http://localhost/api/esports/follows/t1", { method: "DELETE" }),
      { params: { teamId: "t1" } }
    );
    const body = (await res.json()) as { data: { removed: boolean } };

    expect(res.status).toBe(200);
    expect(body.data.removed).toBe(false);
  });
});
