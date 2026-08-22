import { NextRequest, NextResponse } from "next/server";
import {
  getDeviceAccount,
  toDeviceSummary,
} from "@/domains/desktop/services/desktopPairingService";
import { apiError, apiSuccess } from "@/lib/api/response";
import { withDeviceAuth } from "@/lib/api/withDeviceAuth";

export const dynamic = "force-dynamic";

// GET /api/desktop/me — who this machine is acting as.
//
// Also the app's liveness check: reaching it is how the desktop client learns
// its token still works, and answering it is what writes `lastSeenAt`.
export const GET = withDeviceAuth(async (_req: NextRequest, { device }): Promise<NextResponse> => {
  const account = await getDeviceAccount(device);
  // The account was deleted while the device kept its token. Cascade will take
  // the device row too; until it does, the honest answer is that the pairing no
  // longer points at anything.
  if (!account) return apiError("UNAUTHORIZED", "This device is not paired", 401);

  const res = apiSuccess({ device: toDeviceSummary(device), account });
  res.headers.set("Cache-Control", "no-store");
  return res;
});
