import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

let initialized = false;

export function getLsClient(): void {
  if (initialized) return;

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY environment variable is not set");

  lemonSqueezySetup({ apiKey });
  initialized = true;
}

export function getLsStoreId(): string {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) throw new Error("LEMONSQUEEZY_STORE_ID environment variable is not set");
  return storeId;
}

export function getLsProVariantId(): string {
  const variantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;
  if (!variantId)
    throw new Error("LEMONSQUEEZY_PRO_VARIANT_ID environment variable is not set");
  return variantId;
}
