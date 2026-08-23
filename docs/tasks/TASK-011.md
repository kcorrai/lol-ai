# TASK-011 — Subscription & Stripe Integration

**Phase:** 1 — MVP  
**Status:** In Progress — code complete, blocked on Stripe account (Turkey not supported)  
**Estimated Effort:** 2 days

---

## Objective

Implement the monetization layer: Stripe Checkout for upgrading to Pro, Stripe Customer Portal for managing billing, webhook handling for subscription lifecycle events, and enforcement of plan limits throughout the app.

---

## Acceptance Criteria

- [ ] Pricing page shows Free vs. Pro plans with feature comparison — not yet built
- [x] "Upgrade to Pro" button opens Stripe Checkout (Settings > Billing)
- [x] Successful payment updates user's `subscriptions` record to `plan: 'pro'` via webhook
- [x] Stripe webhook handles: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- [x] Canceled subscription downgrades to free tier
- [ ] "Manage Billing" opens Stripe Customer Portal — not yet built
- [x] Current subscription status shown in Settings > Billing page
- [x] Plan limits enforced: Free: 1 riot account, 3 AI reports/month; Pro: 3 accounts, unlimited
- [ ] Users hitting limit see upgrade prompt UI — shows error message only, no redirect

---

## Technical Requirements

### Stripe Setup

- Products: `Pro Monthly` ($14.99/mo), `Pro Annual` ($99/yr)
- Webhook endpoint: `POST /api/webhooks/stripe`
- Signature validation: `stripe.webhooks.constructEvent(body, sig, secret)`

### Subscription Service

`src/domains/identity/services/subscriptionService.ts`:

```typescript
async function createCheckoutSession(
  userId: string,
  plan: "pro",
  interval: "monthly" | "yearly"
): Promise<string>;
async function createPortalSession(userId: string): Promise<string>;
async function handleWebhookEvent(event: Stripe.Event): Promise<void>;
async function getUserPlanLimits(userId: string): Promise<PlanLimits>;
async function checkLimit(
  userId: string,
  limitType: LimitType
): Promise<{ allowed: boolean; reason?: string }>;
```

### Plan Limits Enforcement

`checkLimit()` is called in service layer before performing restricted actions:

- `matchSyncService`: check `max_riot_accounts` before connecting
- `coachingService`: check `reports_per_week` before generating
- `matchSyncService`: check `match_history_depth` when fetching IDs

### Middleware Approach

Do NOT put plan checks in API route handlers. Put them in service functions. This keeps business logic in the right layer and makes it testable.

---

## Environment Variables Required

```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## Pages/Components to Build

- `app/(marketing)/pricing/page.tsx` — public pricing page
- `app/(app)/settings/subscription/page.tsx` — current plan + manage billing
- `PricingCard` component — reusable plan card
- `UpgradePrompt` component — shown when limit is hit

---

## Webhook Security

- Parse body as raw Buffer before JSON parsing (required for signature validation)
- `POST /api/webhooks/stripe` must be excluded from CSRF protection
- All other webhook logic runs after signature validation

---

## Testing Requirements

- Mock Stripe SDK in tests
- Test: successful checkout → subscription record created
- Test: subscription canceled → user downgraded at period end
- Test: webhook with invalid signature → 400 returned
- Test: `checkLimit()` returns correct limits per plan

---

## Dependencies

- TASK-002 (user accounts)
- TASK-003 (subscriptions table)
- Stripe account + products configured

---

## Notes

Use Stripe test mode and test cards during development. Do not test with real card numbers. The webhook URL must be accessible from the internet for Stripe to call — use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
