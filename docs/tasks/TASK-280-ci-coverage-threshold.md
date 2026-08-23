# TASK-280 — Gate CI on coverage

## Status: Done

`docs/BACKLOG-SCORED-2026-07-20.md` finding #17 (score 28), which notes this is "only useful _after_
#6 — a threshold on a 28% baseline that excludes `app/` measures the wrong thing". TASK-261 fixed
the denominator, so the gate can now mean something.

## The problem with a single global number

Coverage is **18.00% statements** (2144/11911), up from the 15.69% honest baseline TASK-261
established. A global threshold at that level is nearly vacuous — it permits almost any regression
anywhere. Setting it high enough to be meaningful would fail CI immediately and get switched off.

So the gate is two-layer.

**A global floor at 17%** (branches 13, functions 14, lines 17), deliberately just _under_ the
measured value. It is a ratchet: it catches coverage going backwards without pretending the current
number is acceptable. Raise it as the number climbs.

**Per-file locks at 100%** on the modules where coverage was built deliberately and where a drop
means a defence was deleted rather than merely untested:

| File                                          | Built in                                                                   |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `src/lib/auth/authorization.ts`               | TASK-265 — every IDOR check and paywall                                    |
| `src/lib/auth/planLimits.ts`                  | TASK-265                                                                   |
| `src/lib/auth/totpService.ts`                 | TASK-266 — 2FA                                                             |
| `src/lib/db/userLock.ts`                      | TASK-267 — the report-quota lock                                           |
| `src/lib/lemonsqueezy/lsWebhookVerify.ts`     | TASK-263 — the only thing between a forged webhook and a free subscription |
| `src/lib/subscription/subscriptionService.ts` | TASK-276                                                                   |

All six measure 100/100/100/100 today. Pinned per file rather than per directory because their
neighbours are not: `src/lib/auth` as a whole is 56.88%, dragged down by `config.ts`.

## Verified that the gate actually fails

A threshold that never fails is worse than none — it reads as protection while providing none. Same
discipline as the concurrency check in TASK-267: the gate was temporarily raised to 99% and CI
reproduced the failure —

```
ERROR: Coverage for statements (18%) does not meet global threshold (99%)
exit 1
```

— then restored, and the passing run re-confirmed at exit 0.

## Known gap, not covered by this gate

`src/lib/api/withAdminAuth.ts` is at **0%** and guards every admin route. It is deliberately _not_
in the locked list, because pinning a file at its current 0% would be theatre. It wants tests, which
is its own task rather than something to smuggle into a CI-config change.

## Changes

- `vitest.config.ts` — `coverage.thresholds`, global plus six per-file entries.
- `.github/workflows/ci.yml` — the test job runs `npm run test:coverage` instead of `npm test`.
