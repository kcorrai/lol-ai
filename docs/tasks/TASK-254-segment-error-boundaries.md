# TASK-254 — No segment-level error boundaries

## Problem

The app had exactly three boundary files, all at the root:

```
app/error.tsx
app/global-error.tsx
app/not-found.tsx
```

Every route group — `(app)`, `(auth)`, `(marketing)`, `(team)`, `(tools)` — had none. In the App
Router an uncaught render error bubbles to the nearest `error.tsx`, so any throw inside a page (a
React Query hook rejecting on a 500, a rate-limit response, a malformed payload) escaped all the way
to the root boundary.

That is bad in two ways:

1. **The shell disappears.** `app/error.tsx` is a `min-h-screen` full-page takeover, so it replaces
   the sidebar and nav along with the failed content. A failure in one dashboard widget blanks the
   entire application chrome, and the only way out is the single hardcoded "Go to Dashboard" link.
2. **The recovery target is wrong for most groups.** That link points at `/dashboard` regardless of
   context. An anonymous visitor hitting an error on a public `/tools` page or a marketing page gets
   sent to a route they cannot access, which bounces them to `/login`.

## Change

**New `src/components/shared/RouteError.tsx`** — one reusable client component holding the error UI,
Sentry reporting, and the retry/navigate controls. Props let each group set what failed (`area`) and
where recovery leads (`homeHref`, `homeLabel`).

Because it renders inside the segment's layout rather than replacing the document, it uses
`min-h-[60vh]` instead of `min-h-screen` — the shell stays on screen and the error occupies the
content area. It also carries `role="alert"` so screen readers announce the failure, which the root
boundary does not.

**Five thin segment boundaries**, each ~8 lines, delegating to it:

| File                        | area           | recovery target                                                          |
| --------------------------- | -------------- | ------------------------------------------------------------------------ |
| `app/(app)/error.tsx`       | your dashboard | `/dashboard`                                                             |
| `app/(tools)/error.tsx`     | this tool      | `/tools` — tools are public, so anonymous users get a usable destination |
| `app/(marketing)/error.tsx` | this page      | `/`                                                                      |
| `app/(team)/error.tsx`      | this team      | `/teams`                                                                 |
| `app/(auth)/error.tsx`      | this page      | `/login` — an unauthenticated user cannot reach `/dashboard`             |

`app/error.tsx` and `app/global-error.tsx` are unchanged; they remain the last-resort boundary for
anything thrown outside a group (layout failures, `app/teams/join`, `app/u`, `app/share`, `app/recap`).

All five recovery targets were verified to resolve to real pages — note `/teams` is served by
`app/(app)/teams/page.tsx`, since route groups do not affect the URL.

## Not included

`loading.tsx` files are deliberately out of scope. The pages already render their own React Query
loading skeletons, so adding route-level suspense fallbacks would double up the loading UI and is a
separate design decision. Filed as follow-up TASK-258.

## Verification

`tsc --noEmit` and ESLint clean; full unit suite green. Manual: throwing inside a page under each
group renders the scoped boundary with the shell intact, and "Try Again" re-runs the segment.

refs TASK-254
