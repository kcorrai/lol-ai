import { NextRequest, NextResponse } from "next/server";
import { listNotifications, markNotificationsRead } from "@/domains/marketplace";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";

// GET /api/notifications — the caller's own, newest first, with an unread count.
//
// The `Notification` table has existed since the initial schema and nothing
// wrote to it until the marketplace needed a coach to find a request they were
// not emailed about. It is general-purpose, so this endpoint is too.
export const GET = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  return apiSuccess(await listNotifications(userId));
});

// PATCH /api/notifications — mark everything read.
export const PATCH = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  return apiSuccess({ read: await markNotificationsRead(userId) });
});
