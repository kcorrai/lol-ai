# TASK-262 — API route test harness

## Status: Done

## Context

`docs/BACKLOG-SCORED-2026-07-20.md` finding #6. **122 route handlers, 0 tests.** Verified: no
`.test.ts` file anywhere imports from `app/api`. CLAUDE.md §5.2 requires 70% coverage on API route
handlers.

This is not neglect — there is no harness. Writing the first route test today means each author
independently solves the same four problems:

1. Constructing a `NextRequest` (needs an absolute URL, and dynamic routes read their id out of
   `req.nextUrl.pathname` — verified in `app/api/riot/[riotAccountId]/route.ts:9-11` — so the URL
   is load-bearing, not decoration).
2. Faking a session. `withAuth` (`src/lib/api/withAuth.ts:38`) calls `getServerSession(authOptions)`
   from `next-auth`, and `authOptions` drags in the Prisma adapter, so both must be mocked.
3. Reading the response. Everything goes through the `apiSuccess`/`apiError` envelope
   (`src/lib/api/response.ts`), so assertions need to reach into `data` / `error.code`.
4. Knowing that `withAuth` swallows thrown `ApiError`s and converts them to a status — so a test
   that expects a throw is testing the wrong thing.

## Scope

1. A harness module giving the four primitives above.
2. Two exemplar route tests that between them cover both route shapes in the codebase:
   - `withAuth`-wrapped with a dynamic segment (`app/api/riot/[riotAccountId]/route.ts`)
   - bare handler with a shared-secret gate (`app/api/cron/weekly-report/route.ts`)
3. Exclude the harness itself from the coverage denominator.

## Out of scope

- Testing the other 120 routes. This task ships the tool and proves it on two; the rest follow as
  their own tasks so PRs stay reviewable (CLAUDE.md §6.3).

## Acceptance criteria

- [x] Harness module exists with request building, session control, and envelope reading —
      `src/test/apiRoute.ts` (`routeRequest`, `authenticateAs`, `authenticateAsNobody`,
      `readApiResponse`).
- [x] Both exemplar route tests pass, covering auth-rejected, validation-rejected, and happy paths —
      15 tests across `app/api/riot/[riotAccountId]/route.test.ts` and
      `app/api/cron/weekly-report/route.test.ts`.
- [x] Full suite green (610 passed, up from 595), `typecheck` and `lint` clean.

## Notes for whoever writes the next route test

- Each route test must declare `vi.mock("next-auth")` and
  `vi.mock("@/lib/auth/config", () => ({ authOptions: {} }))` itself. `vi.mock` is hoisted and
  file-scoped, so the harness cannot register them for you.
- Use `vi.resetAllMocks()` in `beforeEach`, not `vi.clearAllMocks()` — the latter leaves queued
  `mockResolvedValueOnce` values behind and they leak into the next test (TASK-265).
- `withAuth` catches thrown `ApiError`s and converts them to a status code, so assert on
  `error.code` from `readApiResponse` rather than with `expect(...).rejects`.
- Pass the **real** URL to `routeRequest` (`/api/riot/acc-1`, not `/api/riot/[riotAccountId]`) —
  dynamic routes parse the id out of `req.nextUrl.pathname`.
- `src/test/**` is excluded from the coverage denominator so the harness does not inflate the number.
