# ADR-046: The session revocation check reads through Redis

## Status: Accepted

## Context

The NextAuth JWT callback compares the token's `sessionVersion` against the user row's on
every read. That comparison is what makes "sign out all devices" and a password reset take
effect on the intruder's next request instead of whenever their thirty-day JWT expires, and
it is worth having.

It also runs on every authenticated request there is. 131 API routes go through `withAuth`,
`app/(app)/layout.tsx` calls `getSession` on every page under it, and each of those reaches
the callback. So a single integer — one that changes perhaps twice in an account's lifetime —
was the one Postgres round trip an authenticated request could not avoid.

This is not a large number of bytes. It is a large number of round trips, on the hottest path
in the application, against a database billed by transfer and already under pressure
(ADR-045).

## Decision

The check reads through Redis: `src/lib/auth/sessionVersion.ts`, thirty-second TTL, Postgres
on a miss.

**Both revocation paths publish the new version themselves**, immediately after their own
`increment` and with the value that write returned —
`app/api/auth/reset-password/route.ts` and `app/api/sessions/route.ts`. This is the part that
makes the decision defensible: in the expected case there is no staleness window at all,
because the revocation updates the cached value as it happens. The TTL is not the mechanism,
it is the backstop.

**A cache failure is a miss, and a miss reads Postgres.** `redisCacheGet` reports an
unreachable Redis as a miss, so every failure falls through to the exact check. The module has
no catch of its own around the Postgres read, deliberately: the one answer it must never give
is "no revocation" because it could not find out.

## Consequences

**The window, stated rather than buried.** If Upstash is unreachable at the moment a
revocation is published, that revocation is invisible for up to thirty seconds — the writer's
publish is dropped, and instances holding a cached copy keep serving it until it expires.
Thirty seconds is chosen against that: long enough that a busy session's many requests share
one read, short enough that the degraded case is seconds rather than minutes. It is not a
number to raise without revisiting this section.

**Revocation now depends on a second system being healthy to be fast, but not to be correct.**
With Redis down entirely, every check goes to Postgres and the behaviour is exactly what it
was before this ADR — slower than the cached path, and precisely as safe.

**`sessionVersion.test.ts` is written from the failure side.** One test covers the speed; the
rest cover not trading correctness for it, including the string-shaped integer Upstash returns
after a JSON round trip and the junk values that must be treated as absent rather than
coerced. A `Number()` on a half-parsed value deciding whether a session lives is the failure
mode worth spending tests on.

## Alternatives rejected

**Re-check on a timer, from the token.** Stamp `sessionCheckedAt` into the JWT and skip the
check while it is fresh. No Redis, no new dependency — and no way for a revocation to publish
itself, so the window is unconditional rather than a backstop. Strictly worse for the same
saving.

**Leave it alone.** Defensible on transfer grounds alone: this row is a few bytes and ADR-045
is what actually emptied the allowance. It is the round trips on every authenticated request
that make it worth doing, and the write-through is what makes it cost nothing in safety when
both systems are up.
