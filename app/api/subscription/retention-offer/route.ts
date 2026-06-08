import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess, apiError } from "@/lib/api/response";
import { createLsCheckoutUrl } from "@/lib/lemonsqueezy/subscriptionService";
import { prisma } from "@/lib/db/prisma";

// POST /api/subscription/retention-offer
// Creates a discounted checkout URL for the retention offer.
// Requires LEMONSQUEEZY_RETENTION_COUPON_CODE env var to be configured in LS dashboard.
export const POST = withAuth(async (_req, { userId }) => {
  const couponCode = process.env.LEMONSQUEEZY_RETENTION_COUPON_CODE;
  if (!couponCode) {
    return apiError("NOT_FOUND", "Retention offer not configured", 404);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  try {
    const url = await createLsCheckoutUrl(userId, user?.email ?? null, "monthly");
    // Append coupon code — LS checkout URLs support ?checkout[coupon]=CODE
    const urlWithCoupon = `${url}&checkout[coupon]=${encodeURIComponent(couponCode)}`;
    return apiSuccess({ url: urlWithCoupon });
  } catch {
    return apiError("INTERNAL_ERROR", "Failed to create offer URL", 500);
  }
});
