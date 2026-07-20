# TASK-276 — Remove the Stripe remnants

## Status: Done

`docs/BACKLOG-SCORED-2026-07-20.md` finding #14 (score 40): "Two payment providers, one of them
possibly dead. Dead payment code is a liability." User approved deleting the Stripe path.

## What is actually there — the finding was half right

The backlog treats `src/lib/stripe/subscriptionService.ts` as dead Stripe code. It is neither dead
nor Stripe.

**It is live.** Three importers:
- `app/api/subscription/route.ts` — the subscription endpoint
- `src/hooks/useSubscription.ts`
- `app/(tools)/ToolUpgradeNudge.tsx`

**It contains zero Stripe code.** Read in full: it is 36 lines of Prisma reading the `Subscription`
table and the user's referral trial, and it is provider-agnostic. Deleting it would have broken the
subscription endpoint.

What *is* genuinely dead is the **`@stripe/stripe-js` package**: 0 imports across the whole
repository. That is the actual liability — an unused payment SDK sitting in `dependencies`, shipped
and dependabot-tracked, implying an integration that does not exist.

## Changes

1. **Remove `@stripe/stripe-js`** from `dependencies`. Verified unused.
2. **Move `src/lib/stripe/subscriptionService.ts` → `src/lib/subscription/subscriptionService.ts`**
   and delete the empty `lib/stripe/` directory. The misleading path is the whole reason this looked
   like a second payment integration in an audit; three import lines change. In scope rather than
   unsolicited refactoring (CLAUDE.md §2.1) because the ambiguity *is* the task.

## Deliberately not changed

`prisma/schema.prisma:228-230` keeps `stripeCustomerId` / `stripeSubscriptionId`. The comment
already explains why — historical rows from before the LemonSqueezy migration (ADR-004 / TASK-112).
Dropping columns is a schema change requiring explicit discussion per CLAUDE.md §8.2, and the data
is a payment audit trail. Left alone on purpose, not overlooked.

No `STRIPE_*` variables exist in `.env.example`, and `docs/DEPENDENCIES.md` never documented the
package.

## Acceptance criteria

- [ ] `@stripe/stripe-js` gone from package.json; nothing imports it.
- [ ] Subscription endpoint still works — it is the thing a naive deletion would have broken.
- [ ] Full suite, typecheck, lint clean.
