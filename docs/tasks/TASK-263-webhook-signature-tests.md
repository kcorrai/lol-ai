# TASK-263 — Test the billing webhook signature verification

Scored **96/100** in `docs/BACKLOG-SCORED-2026-07-20.md` — the highest item in the backlog.

## Problem

`src/lib/lemonsqueezy/lsWebhookVerify.ts` sat at **0% coverage**, along with every other file in
`src/lib/lemonsqueezy/`. The implementation was already correct — raw body, HMAC-SHA256,
`timingSafeEqual` — and that is precisely why it scored highest: **nothing would have told us if it
stopped being correct.**

`verifyLsWebhookSignature` is the only thing standing between the public internet and
`dispatchLsWebhookEvent`. If it returns `true` for a forged payload, anyone can POST a
`subscription_created` event and grant themselves a paid plan. A refactor that broke it would fail
no test and no build.

## Change

New `src/lib/lemonsqueezy/lsWebhookVerify.test.ts` — 20 tests, no production code changed.

Target is the leaf module rather than `subscriptionService.ts`, which merely re-exports these three
functions at lines 9-13 (the webhook route imports them from there, so both paths are covered).

## The test that actually matters

Nineteen of the twenty tests are the obvious ones — valid signature, tampered body, wrong secret,
signature valid for a _different_ body, malformed/truncated/over-long hex, empty secret, single
flipped character.

**All nineteen pass against a plain `hash === signature`.** That was verified, not assumed: replacing
`timingSafeEqual` with `===` and rerunning gave `1 failed | 19 passed`. A byte-by-byte `===` is
functionally correct and leaks the expected signature through response timing, so a suite of only
those nineteen would have green-lit a timing-attackable rewrite — security theater.

So `crypto` is mocked with `importOriginal` to spy on `timingSafeEqual`, and one test asserts it is
actually called:

```ts
it("compares in constant time rather than with ===", () => {
  vi.mocked(timingSafeEqual).mockClear();
  verifyLsWebhookSignature(VALID_BODY, sign(VALID_BODY), SECRET);
  expect(timingSafeEqual).toHaveBeenCalledTimes(1);
});
```

This asserts on implementation rather than behaviour, which is normally a smell. It is correct here
because for a timing-attack defence the _implementation is the contract_ — there is no observable
behavioural difference to assert on.

## Also covered

- `buildEventKey` — stable across retries of an identical event; distinct when event name,
  subscription id, status, or renewal date differ (a collision here would silently swallow a genuine
  event as a duplicate). Plus the `ends_at` fallback and the both-null case.
- `checkAndRecordEvent` — first delivery returns `false` and records; a unique-constraint violation
  returns `true`. The failing insert _is_ the duplicate signal, which is what makes it atomic under
  concurrent deliveries.

## Verification

`npx vitest run src/lib/lemonsqueezy/lsWebhookVerify.test.ts` — 20 passed.
Mutation check (`timingSafeEqual` → `===`) — 1 failed, 19 passed, then reverted.
Full suite 521 green; `tsc --noEmit` and ESLint clean.

refs TASK-263
