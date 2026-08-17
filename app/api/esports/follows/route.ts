import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { followTeam, listFollows, MAX_FOLLOWS } from "@/domains/esports";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const FollowBody = z.object({
  // The slug, not the id — it is what the page the button sits on already has
  // in its URL. The service resolves it to the id the row hangs on.
  slug: z.string().trim().min(1).max(120),
});

// GET /api/esports/follows — the reader's followed teams, newest first.
export const GET = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  return apiSuccess({ follows: await listFollows(userId), limit: MAX_FOLLOWS });
});

// POST /api/esports/follows — follow a team by slug. Idempotent.
export const POST = withAuth(async (req: NextRequest, { userId }): Promise<NextResponse> => {
  const parsed = FollowBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) throw Errors.validation("A team slug is required.");

  const result = await followTeam(userId, parsed.data.slug);

  if (!result.ok) {
    if (result.reason === "unknown-team") throw Errors.notFound("Team");
    throw Errors.forbidden(`You can follow up to ${MAX_FOLLOWS} teams.`);
  }

  return apiSuccess({ follow: result.entry });
});
