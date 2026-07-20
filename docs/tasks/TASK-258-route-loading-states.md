# TASK-258 — No route-level loading states

Status: **open — not yet implemented.** Split out of TASK-254.

## Problem
No route group has a `loading.tsx`. Pages render their own React Query skeletons, so this is not a
blank-screen bug — but it means the *server* portion of a navigation has no fallback. On a slow
segment the user clicks a nav link and nothing happens until the server component resolves, which
reads as an unresponsive UI.

## Why this was not bundled into TASK-254
Adding `loading.tsx` interacts with the skeletons the pages already render: done naively the user
sees a route-level skeleton replaced by a component-level skeleton, i.e. two different loading UIs
back to back. Getting this right is a design decision about which layer owns the loading state, not a
mechanical addition, so it needs its own task.

## Suggested approach
1. Decide the layer: route-level `loading.tsx` for the page shell (header, card outlines) and leave
   per-widget skeletons for data that streams in independently.
2. Add `loading.tsx` to `(app)` and `(team)` first — those are authenticated, data-heavy, and slowest.
3. Reuse the existing skeleton primitives rather than inventing new ones (grep `Skeleton` in
   `src/components/ui/`).

refs TASK-258
