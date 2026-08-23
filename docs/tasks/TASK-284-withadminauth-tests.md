# TASK-284 — Test `withAdminAuth`

## Status: Done

Found while setting the coverage gate in TASK-280, not from the backlog.

## Problem

`src/lib/api/withAdminAuth.ts` was at **0% coverage** and it guards every admin route. TASK-280
documented it as a known gap and deliberately left it out of the locked file list, because pinning a
file at 0% would be theatre. This closes it so the lock can be real.

It is the same shape as `lsWebhookVerify` in TASK-263: a small, correct-looking security function
where nothing would tell you if it stopped being correct.

## What the tests pin down

Beyond the obvious admin/non-admin/anonymous paths, three things that are easy to break silently:

- **Check order.** An unset `ADMIN_EMAIL` is rejected _before_ the session is read. Reversing those
  two blocks would compare every user's email against `undefined` — the comment in the file claims
  it "falls back gracefully", and this is what makes that claim testable.
- **Empty string is not a match.** `ADMIN_EMAIL=""` must behave as unset rather than matching a
  session whose email is also empty.
- **Exact comparison.** Parametrised cases for different case, leading whitespace, a suffixed domain
  (`admin@lolai.test.evil.com`) and a prefixed local part (`xadmin@…`). None of these is a defect
  today — `!==` handles all four — but they are precisely what a well-intentioned "normalise the
  email before comparing" refactor would break.

Also asserts that a signed-in non-admin gets 403 rather than 401, so the two rejection reasons stay
distinguishable to a caller.

## Follow-up

`src/lib/api/withAdminAuth.ts` added to the per-file 100% locks in `vitest.config.ts`, now that the
number reflects real tests. Measured 100/100/100/100.
