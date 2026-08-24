import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { getCurrentSubscription } from "@/lib/subscription/subscriptionService";

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const subscription = await getCurrentSubscription(userId);
  return apiSuccess(subscription);
}, { deviceAccess: true });
