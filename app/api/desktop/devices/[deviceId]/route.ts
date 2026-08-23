import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revokeDevice } from "@/domains/desktop/services/desktopPairingService";
import { Errors } from "@/lib/api/errors";
import { apiSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

// DELETE /api/desktop/devices/[deviceId] — cut a machine off.
//
// The row stays and gains a `revokedAt`, so the token remains taken and the
// player keeps a record. A device id that is not theirs answers 404 rather than
// 403: the service scopes the write by userId, so this route cannot tell the two
// apart, and it should not be able to.
export function DELETE(
  req: NextRequest,
  { params }: { params: { deviceId: string } }
): Promise<NextResponse> {
  return withAuth(async (_r, { userId }): Promise<NextResponse> => {
    // Checked here rather than left to the query: the column is `uuid`, so
    // Postgres rejects a malformed id with an error Prisma raises, and the caller
    // would see a 500 where they should see a 404.
    if (!z.string().uuid().safeParse(params.deviceId).success) throw Errors.notFound("Device");

    const revoked = await revokeDevice(userId, params.deviceId);
    if (!revoked) throw Errors.notFound("Device");

    return apiSuccess({ revoked: true });
  })(req);
}
