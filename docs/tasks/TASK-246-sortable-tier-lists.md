# TASK-246 — Sortable tier list columns

## Goal

Let the ranked and ARAM tier lists be reordered by clicking Tier, Patch, Win, Pick or Ban
(6.png, 8.png). Both lists already shared `TierRow`, so one sortable table serves both.

## Change

- `app/(tools)/tools/tier-list/sortEntries.ts` (new) — pure `sortEntries(entries, column,
direction)` plus `defaultDirectionFor`. Rank and tier are "lower is better" so they open
  ascending; the rate columns and movement open descending. Ties fall back to meta rank so equal
  values don't reshuffle arbitrarily.
- `app/(tools)/tools/tier-list/SortableTierTable.tsx` (new, client) — owns the sort state, renders
  the `<thead>` buttons with `aria-sort` and a ▲/▼ indicator, maps `TierRow` unchanged. Props
  mirror the old ones (`showBan`, `showMovement`, `hrefBase`) so ARAM still hides Ban and Patch.
- `TierListView.tsx` and `app/(tools)/aram/tier-list/page.tsx` drop their duplicated `<table>`
  shells in favour of it.
- `src/domains/meta/tierLetter.ts` (new) — see below.

## The build break worth recording

Making the table a client component broke `next build`:

```
Module not found: Can't resolve 'async_hooks'
  ./src/lib/context/requestContext.ts → logger.ts → championDetailService.ts
  → src/domains/meta/index.ts → TierRow.tsx → SortableTierTable.tsx
```

`TierRow` imported `tierLetter` from the `@/domains/meta` barrel. That was harmless while the row
was server-only, but a client parent drags the whole barrel — and with it the server-only logger
— into the browser bundle. `tierLetter` is a five-entry lookup table, so it moved to a leaf module
with no imports; `tierListService` re-exports it, keeping the domain's public surface unchanged.

This is the concrete cost CLAUDE.md §3.1 warns about when it bans barrel files. **Before importing
anything from a domain barrel into a client component, check what the barrel reaches.**

## SSG is intact

The tier list pages use `generateStaticParams` with `dynamicParams=false`. A client component
still prerenders, and the default sort is the service's own order, so the served HTML is unchanged
— verified with `curl`: champion links come back in rank order (Locke, Ahri, Sylas, Fizz…).
`next build` generates 738/738 static pages. The three `opengraph-image` export errors are the
known Windows-only `@vercel/og` bug recorded in Phase 6, not a regression.

## Tests

`sortEntries.test.ts` — default order untouched, each column both directions, pick-rate ties fall
back to rank, tier keeps meta order within a tier, movement ranks by rank climbed, champions with
no previous-patch ranking sink to the bottom in _both_ directions (a new champion must not read as
the biggest faller), and the input array is not mutated.

## Verified live

`/tools/tier-list/mid` — Win/Pick/Ban/Tier all reorder, a second click reverses, `aria-sort`
tracks the active column, win-rate descending confirmed monotonic. `/aram/tier-list` — sorts with
Ban and Patch correctly absent.

refs TASK-246
