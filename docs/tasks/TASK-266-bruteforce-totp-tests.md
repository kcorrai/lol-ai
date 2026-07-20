# TASK-266 — Test brute-force throttling and 2FA

Scored **74/100**.

## Problem
`src/lib/security/bruteForce.ts` (81 lines) and `src/lib/auth/totpService.ts` (65 lines) were both at
0% coverage. The wiring around them is right — `register`, `forgot-password` and `reset-password` all
call the throttle, verified during the audit — but the logic inside had nothing checking it.

## Change
Two new test files, 30 tests total. No production code changed.

### `bruteForce.test.ts` (8 tests)
Covers attempts below the threshold, the attempt that trips it, staying locked out afterwards,
per-identifier isolation, the Sentry report, fixed-window expiry, and `clearFailedAttempts` restoring
the full allowance.

Two of these encode security properties rather than mechanics:
- **Per-identifier isolation** — a global counter would let one attacker hammering a single account
  lock out every other user.
- **Window expiry is fixed, not sliding** — a slow guesser must not be locked out permanently.
  Driven by stubbing `Date.now()` past the 15-minute window.

**Isolation approach:** the module keeps its fallback counters in a module-level `Map` with no reset
export. Rather than reaching into module internals, each test allocates its own identifier from a
counter. That also mirrors production, where the key is a per-user or per-IP string. Verified
order-independent with `--sequence.shuffle`.

### `totpService.test.ts` (22 tests)
Setup (secret, 8 unique backup codes, URL-encoded otpauth label, fresh values per call), token
verification (correct token round-trips via `generateSync` with the same options; a token from a
different secret is rejected), and backup codes.

The verification tests all assert **`false` rather than a throw** for empty, non-numeric,
wrong-length and malformed-ciphertext inputs. `verifyTotpToken` sits on the login path: an exception
would surface as a 500 instead of a failed second factor, which is both worse UX and an oracle.

Backup-code tests pin that exactly one code is consumed (a matched code left in the list would be
replayable forever), that lowercase/spacing variants normalize — users retype the codes as displayed
— that a miss leaves the list untouched, and that codes are stored bcrypt-hashed, never in plaintext.

## Flagged, deliberately not fixed here
Three things found while writing these. Each deserves its own task rather than widening this one:

1. **No TOTP replay protection.** `verifyTotpToken` accepts the same token repeatedly within its 30s
   window. An attacker who observes one code can reuse it until it rotates. The standard fix is
   storing the last-used counter per user and rejecting a repeat.
2. **TOTP secrets are encrypted with `DISCORD_ENCRYPTION_KEY`.** `encryptTotpSecret` calls
   `encryptString` from `src/lib/crypto/encrypt.ts`, which reads that variable. It works, but the
   name is wrong for the use, and rotating the "Discord" key would silently break 2FA for every
   enrolled user. Wants renaming to a neutral `ENCRYPTION_KEY` with a migration path.
3. **`encrypt.ts` uses AES-256-CBC with no authentication tag**, so ciphertexts are malleable.
   AES-256-GCM would be the better primitive for secrets at rest.
4. **`bruteForce`'s in-memory `Map` is never swept** — entries are only reset lazily per key, so it
   grows with the number of distinct identifiers seen. Bounded in practice by serverless instance
   lifetime, but unbounded in a long-lived process.

## Verification
`npx vitest run src/lib/security/bruteForce.test.ts src/lib/auth/totpService.test.ts` — 30 passed,
and again under `--sequence.shuffle`. Full suite green; `tsc --noEmit` and ESLint clean.

refs TASK-266
