import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import {
  getLsClient,
  getLsStoreId,
  getLsProVariantId,
  getLsProYearlyVariantId,
  getLsTeamVariantId,
} from "@/lib/lemonsqueezy/client";
import { logger } from "@/lib/utils/logger";

export async function createLsCheckoutUrl(
  userId: string,
  userEmail: string | null,
  period: "monthly" | "annual" = "monthly"
): Promise<string> {
  getLsClient();

  const storeId = getLsStoreId();
  const variantId = period === "annual" ? getLsProYearlyVariantId() : getLsProVariantId();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutOptions: { embed: false, media: false, logo: true },
    checkoutData: {
      email: userEmail ?? undefined,
      custom: { userId },
    },
    productOptions: {
      redirectUrl: `${appUrl}/dashboard?upgraded=true`,
      receiptButtonText: "Go to Dashboard",
      receiptThankYouNote: "Welcome to Pro! Your account has been upgraded.",
    },
  });

  if (error || !data?.data?.attributes?.url) {
    logger.error("[lemonsqueezy] createCheckout failed", { error });
    throw new Error("Failed to create LemonSqueezy checkout session");
  }

  return data.data.attributes.url;
}

export async function createLsTeamCheckoutUrl(
  userId: string,
  userEmail: string | null
): Promise<string> {
  getLsClient();
  const storeId = getLsStoreId();
  const variantId = getLsTeamVariantId();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutOptions: { embed: false, media: false, logo: true },
    checkoutData: {
      email: userEmail ?? undefined,
      custom: { userId },
    },
    productOptions: {
      redirectUrl: `${appUrl}/teams?upgraded=true`,
      receiptButtonText: "Go to Team",
      receiptThankYouNote: "Welcome to Team Plan! You can now create your team.",
    },
  });

  if (error || !data?.data?.attributes?.url) {
    logger.error("[lemonsqueezy] createTeamCheckout failed", { error });
    throw new Error("Failed to create LemonSqueezy team checkout session");
  }

  return data.data.attributes.url;
}
