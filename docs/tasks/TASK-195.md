# TASK-195: Account analysis — consistency + visual polish

## Status: Done

## Goal
The public "Analyze your own account" surfaces (landing demo card + full /s/
profile page) were inconsistent and visually rough.

## Scope
- `PreviewResultCard`: render the real profile icon (was a fake letter circle),
  fix the inverted third stat cell (value = ranked W/L record, label =
  "Ranked (Season)"), and add champion icons to the favourites list — matching
  the full page. Reuses `profileIconUrl`/`championIconUrl` from `@/lib/ddragon`.
- `(marketing)/page.tsx`: add `id="demo"` (+ `scroll-mt-20`) to the demo section
  so the "Search another player → home demo" link from /s/ actually lands there.
- `/s/[region]/[gameName]/[tagLine]/page.tsx`: widen from `max-w-lg` to `max-w-3xl`
  with a 2-column (`md:grid-cols-2`) layout for champions + matches; replace the
  distorted `scale-125 object-top` loading-splash match art with the clean square
  champion icon.

## Tests
- Typecheck + lint clean. Manual: demo card shows real icon + correct stats;
  /s/ page is wider with 2 columns and the demo anchor resolves.

## Commit
`fix(account): align preview/profile surfaces and polish layout`
