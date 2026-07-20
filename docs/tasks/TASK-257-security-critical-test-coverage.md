# TASK-257 — No tests on security- and money-critical code

Status: **open — not yet implemented**

## Problem
The suite is green at 501 tests, but coverage is concentrated in analysis/meta services. Verified: the
following have **no co-located test file at all**, and each is either a security control or a payment
path:

| File | Lines | What it guards |
|---|---|---|
| `src/lib/lemonsqueezy/lsWebhookVerify.ts` | 39 | HMAC signature on billing webhooks — the control that stops forged "subscription created" events |
| `src/lib/auth/authorization.ts` | 83 | Ownership assertions + plan limits (every IDOR defence in the app) |
| `src/lib/auth/totpService.ts` | 65 | 2FA enrolment and verification |
| `src/lib/security/bruteForce.ts` | 81 | Login attempt throttling |
| `src/lib/api/rateLimit.ts` | 71 | Has a test; `rateLimitBackends.ts` does not |
| `src/lib/ai/providers/openai.ts` | 73 | LLM calls + token accounting |
| `src/lib/ai/providers/anthropic.ts` | 69 | LLM calls + token accounting |

CLAUDE.md §5.4 also explicitly requires AI pipeline tests covering happy path, API error, malformed
data, and cache hit. Only the cache-hit case now exists, via TASK-253's `matchupGuideService.test.ts`.

These are the tests where a regression is silent and expensive: a broken signature check does not
fail a build, it grants free subscriptions.

## Suggested order
1. `lsWebhookVerify` — pure function over (body, signature, secret). Cheapest to test, highest
   consequence. Cover: valid signature, tampered body, wrong secret, missing/malformed header, and
   that comparison is constant-time (assert `timingSafeEqual` is used, not `===`).
2. `authorization.ts` — mock Prisma; cover owns/does-not-own, each plan limit boundary, and the
   free-plan disconnect lock.
3. `totpService` — known RFC 6238 vectors, window tolerance, replay rejection.
4. `bruteForce` — lockout threshold, window expiry, per-identifier isolation.
5. AI providers — mock the SDK; cover API error, malformed response, and token accounting.

## Note on the coverage numbers in the audit
The subagent's headline figures ("~10-15% vs the 70-90% requirement") were extrapolated from
file-existence counts, not from `vitest --coverage`. Run `npm run test:coverage` for real numbers
before treating those percentages as fact. The *specific* gaps listed in the table above were
verified individually.

refs TASK-257
