import { NextRequest, NextResponse } from "next/server";
import { listDevices } from "@/domains/desktop/services/desktopPairingService";
import { apiSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/api/withAuth";

export const dynamic = "force-dynamic";

// GET /api/desktop/devices — the machines this account has paired.
//
// Revoked ones are included and marked. A device list that quietly forgets what
// was cut off cannot answer the question people actually open it to ask.
export const GET = withAuth(async (_req: NextRequest, { userId }): Promise<NextResponse> => {
  return apiSuccess({ devices: await listDevices(userId) });
});
