import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { getStripe } from "@/lib/stripe/client";
import { getOrCreateStripeCustomer } from "@/lib/stripe/subscriptionService";

export const POST = withAuth(async (_req: NextRequest, { userId, userEmail }) => {
  const priceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  if (!priceId) throw Errors.validation("Stripe price ID is not configured");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const customerId = await getOrCreateStripeCustomer(userId, userEmail);

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/settings/billing`,
  });

  if (!session.url) throw Errors.validation("Failed to create checkout session");

  return apiSuccess({ url: session.url });
});
