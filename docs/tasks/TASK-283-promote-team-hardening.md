# TASK-283 — Harden the promote-team endpoint

## Status: Done

`docs/BACKLOG-SCORED-2026-07-20.md` finding #21 (score 20).

## Context — what this is _not_

An automated audit pass originally called this a privilege escalation. It is not, and that was
already rejected in `docs/AUDIT-2026-07-20.md`: the route requires either an `ADMIN_EMAIL` session
or `CRON_SECRET`, and both checks are correct. Re-verified here by test.

What was actually wrong is smaller and real.

## Problems

1. **`err.message` returned to the caller** (line 45-46). An unexpected database failure sent Prisma's
   message — which can carry a table name, a constraint name, or a host and port — to whoever called
   an endpoint that hands out a paid plan.
2. **`await req.json()` unguarded** (line 20). A malformed body threw out of the handler rather than
   producing a 422.
3. **No body validation.** `body.email` was cast, not parsed, so any value flowed into a
   `findUnique` on email.
4. **Non-standard response shape.** Bare `{ error }` / `{ ok: true }` instead of the
   `apiSuccess`/`apiError` envelope every other route uses (`docs/API_DESIGN.md`).

## Changes

Zod body schema, guarded JSON parse, the shared response envelope, and the raw error logged rather
than returned. The dual auth stays local rather than moving to `withAdminAuth` — that wrapper only
knows the session path, and this route legitimately serves the scheduler too. Comment added saying
so, since "why isn't this using the wrapper" is the obvious next question.

`Boolean(cronSecret)` rather than the bare truthiness chain, so the type is `boolean` rather than
`string | boolean | undefined`.

## Tests

11 new — the route had none. Notably both fail-closed cases: an unset `ADMIN_EMAIL` must not turn
every session into an admin, and an unset `CRON_SECRET` must not let `Bearer undefined` through.
Plus an explicit assertion that a database error's message does not reach the response body.

## Acceptance criteria

- [x] No raw error message in any response.
- [x] Malformed and invalid bodies return 422 rather than throwing.
- [x] Every rejection path covered by a test, including both fail-closed cases.
- [x] Full suite, typecheck, lint clean.
