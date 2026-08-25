import { UI_LOCALE } from "@/lib/uiLocale";

/**
 * How money is written across the coaching section.
 *
 * Whole units by default: every price here is a round figure a coach typed, and
 * trailing zeroes on a HUD read as precision the number does not have.
 */
export function formatMoney(cents: number, currency: string, showCents = false): string {
  return new Intl.NumberFormat(UI_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(cents / 100);
}
