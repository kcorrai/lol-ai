# TASK-208: Cart-abandonment email for unfinished Pro checkouts

## Status: Done

## Goal

Users who start a Pro checkout but don't convert get no follow-up. Add a delayed
reminder email (with the retention coupon when configured) to recover them.

## Context (verified)

- Checkout entry: `app/api/lemonsqueezy/checkout/route.ts` (POST, withAuth → has
  userId + userEmail) calls `createLsCheckoutUrl`. No "checkout started" tracking.
- Inngest: functions registered in `app/api/inngest/route.ts` via `serve`. Pattern
  from `planRenewal.ts` — `inngest.createFunction({ id, triggers:[{event}], ... },
async ({ event, step }) => ...)`. Client: `@/inngest/client`.
- Conversion check: `checkIsPro(userId)` in `src/lib/auth/authorization.ts`.
- Email: `getEmailClient()` + `EMAIL_FROM` (`@/lib/email/client`), templates via
  `renderEmailShell`; respect `user.emailOptOut` (as planRenewal does).
- Coupon: `LEMONSQUEEZY_RETENTION_COUPON_CODE`; discounted URL =
  `${checkoutUrl}&checkout[coupon]=CODE` (pattern from retention-offer route).

## Scope

- `checkout/route.ts`: after building the URL, fire `inngest.send({ name:
"checkout/started", data: { userId, email, period } })` (guarded, non-blocking).
- `src/inngest/functions/cartAbandonment.ts`: `cartAbandonmentReminder` — trigger
  `checkout/started`, `step.sleep("2h")`, re-check `checkIsPro`; if still free and
  not opted out, send the reminder (discounted checkout URL when a coupon exists,
  else /settings/billing). `idempotency: "event.data.userId"` to avoid duplicate
  sends per user/day.
- `src/lib/email/templates/checkoutAbandoned.ts`: `buildCheckoutAbandonedEmail`.
- Register the function in `app/api/inngest/route.ts`.

## Tests

tsc + lint + vitest green. (No unit test infra for Inngest jobs in this repo; the
function mirrors existing email workers.)

## Commit

`feat(growth): cart-abandonment reminder email for unfinished Pro checkouts`
