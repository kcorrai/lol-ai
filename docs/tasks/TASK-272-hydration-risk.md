# TASK-272 — Hydration risk from `Date.now()` in render

## Status: Closed — not a defect today, but a latent one. No code change.

`docs/BACKLOG-SCORED-2026-07-20.md` finding #10 (score 52). The finding itself said
"confirm an actual console mismatch warning before fixing" — this task is that confirmation, and
the answer is that there is nothing to fix yet.

## What was claimed

Four components call `Date.now()` during render to produce a relative timestamp. Three are
`"use client"` and therefore server-rendered, so the server and the client could compute different
strings ("5m ago" vs "6m ago") and React would report a hydration mismatch.

## What is actually true

**No mismatch occurs, and it cannot occur as the app is currently wired.**

The flagged call sites are:

| File                           | Call           | Renders when loading                   |
| ------------------------------ | -------------- | -------------------------------------- |
| `ConnectedAccountsList.tsx:18` | `relativeTime` | `if (isLoading)` → skeleton            |
| `DailyChallengeWidget.tsx:7`   | `timeLeft`     | `if (isLoading)` → skeleton            |
| `RecentMatchList.tsx:24`       | `timeAgo`      | `if (isLoading)` → skeleton (line 137) |

All three read their data from React Query, and **the project has no server-side query hydration** —
a search for `HydrationBoundary`, `dehydrate` and `prefetchQuery` returns nothing outside a code
sample in `docs/FRONTEND_ARCHITECTURE.md:214`. So on the server render `isLoading` is always true,
every one of them short-circuits to a skeleton, and the timestamp helpers never execute during SSR.
There is no server-rendered string for the client to disagree with.

`DataFreshness.tsx` was flagged too and is a **server component** — it was never a candidate.

## Verified empirically

Dev server on `localhost:3001`, real session, browser console captured on `/dashboard`
(`RecentMatchList` + `DailyChallengeWidget`) and `/settings/accounts` (`ConnectedAccountsList`).

**Zero hydration warnings on both pages.** The only console error is
`@vercel/analytics` requesting `va.vercel-scripts.com/v1/script.debug.js` against a `script-src
'self'` CSP — chased down and dismissed: that absolute URL exists only in the package's _debug_
path, and production loads the same-origin `/_vercel/insights/script.js`, which the CSP allows. Not
a defect either.

## Why this is still worth reading

The safety here is **incidental, not designed**. It rests entirely on React Query never having
server-side data. Adding `HydrationBoundary` / `prefetchQuery` / `initialData` is a routine Next.js
optimisation — and `docs/FRONTEND_ARCHITECTURE.md:214` literally demonstrates the `initialData`
pattern — so the day someone prefetches any of these three queries on the server, all three
components begin rendering real timestamps during SSR and start mismatching.

Recorded rather than pre-emptively fixed: wrapping three components in `suppressHydrationWarning` or
mount-guards today would add permanent complexity to defend against a condition that does not exist,
and would obscure the real one when it arrives.

**If you add server-side query hydration, fix these three first.**
