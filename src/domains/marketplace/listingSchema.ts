import { z } from "zod";
import {
  MIN_PRICE_CENTS,
  MAX_PRICE_CENTS,
  MIN_DURATION_MINUTES,
  MAX_DURATION_MINUTES,
} from "@/domains/marketplace/policy";

// The listing request body, shared by the create and update routes.
//
// Deliberately separate from the service's own checks rather than replacing
// them. This says whether the request parsed; `serviceListingService.validate`
// says whether the product makes sense (an async review with no promised
// turnaround parses perfectly well and is still not something we can sell).

export const ListingBody = z.object({
  kind: z.enum(["VOD_REVIEW", "LIVE_SESSION", "LIVE_SPECTATE"]),
  title: z.string().trim().min(4).max(80),
  description: z.string().trim().min(20).max(2000),
  durationMinutes: z.number().int().min(MIN_DURATION_MINUTES).max(MAX_DURATION_MINUTES),
  priceCents: z.number().int().min(MIN_PRICE_CENTS).max(MAX_PRICE_CENTS),
  // ISO 4217. Uppercased here so "usd" and "USD" cannot become two currencies.
  currency: z.string().trim().length(3).toUpperCase(),
  deliveryHours: z.number().int().min(1).max(336).nullable().default(null),
});

export type ListingBodyInput = z.infer<typeof ListingBody>;
