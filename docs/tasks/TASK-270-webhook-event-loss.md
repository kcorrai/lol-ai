# TASK-270 — Billing events were silently dropped when a handler failed

Found while reading the code to plan the backlog; not in the original audit.

## Problem
`app/api/lemonsqueezy/webhook/route.ts` recorded the idempotency key **before** running the handler:

```ts
if (await checkAndRecordEvent(eventKey)) return 200 duplicate;   // ← row written here
try {
  await dispatchLsWebhookEvent(eventName, payload);
} catch {
  return 500;                                                     // ← ask LS to retry
}
```

The 500 asks LemonSqueezy to retry — but the retry hits the already-written key, is classified as a
duplicate, and returns 200 **without processing**. So any transient failure inside
`dispatchLsWebhookEvent` (a DB blip, a pool timeout, a cold-start hiccup) meant a paid subscription
was **never applied, permanently, with no error surfaced to anyone**. The user pays and does not get
their plan.

The inline comment showed this was a deliberate trade — *"we'd rather lose an event than
double-process"* — so the fix has to address the concern behind it, not just reorder the calls.

## Why "just record after dispatch" is not enough
Recording afterwards loses the concurrency lock: two simultaneous deliveries of the same event would
both find no row and both process. And on a crash between dispatch and record, the event replays.

## Change — two-phase claim
`WebhookEvent.processedAt` becomes **nullable** and is no longer defaulted. It now carries state
rather than just a timestamp:

| Row state | Meaning | Retry behaviour |
|---|---|---|
| absent | never seen | claim and process |
| `processedAt = null` | claimed, did not finish | **re-claim and process** |
| `processedAt` set | finished | skip as duplicate |

- `claimWebhookEvent(eventKey)` inserts with `processedAt: null`. The unique constraint is still the
  lock, so a concurrent duplicate loses the insert race — it then reads the row and only proceeds if
  the winner has not finished.
- `markWebhookEventProcessed(eventKey)` stamps it, and only then does a later delivery count as a
  duplicate.

The original concern is answered directly: double-processing is safe here because every handler in
`lsWebhookDispatch.ts` ends in an upsert (`upsertSubscription`), so re-running one converges on the
same state. Losing a payment event does not converge on anything.

Migration `20260720000003_webhook_event_processed_nullable` drops the default and the NOT NULL.
Existing rows keep their timestamps and are therefore read as processed — correct, since under the
old code a row only ever existed after a successful dispatch.

## Tests
`lsWebhookVerify.test.ts` grew to 23. The four claim cases: first-seen claims unstamped; a concurrent
delivery that lost the race is refused; **an event whose previous attempt failed is re-claimed** (the
regression test for this bug); and a vanished row is refused. Plus `markWebhookEventProcessed`
stamping with the right key.

## Verification
`npx vitest run src/lib/lemonsqueezy/lsWebhookVerify.test.ts` — 23 passed. `prisma validate` clean,
client regenerated, no stale `checkAndRecordEvent` references remain. Full suite green; `tsc` and
ESLint clean.

**Migration not applied to prod** — needs to run with the TASK-251 index migration.

refs TASK-270
