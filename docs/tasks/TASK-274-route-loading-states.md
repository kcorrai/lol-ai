# TASK-274 — Route-level loading states where they actually help

## Status: Done

`docs/BACKLOG-SCORED-2026-07-20.md` finding #16 (score 30). The finding itself flags the trap:
"Pages have their own skeletons, so this is a polish item, and doing it naively produces two loading
UIs in sequence."

## Measurement first

There are **0** `loading.tsx` files. The obvious move is to mirror TASK-254 and drop one in each of
the five route groups. That would be wrong for three of them. Counting async server pages per group:

| Group         | Async pages | Verdict |
| ------------- | ----------- | ------- |
| `(app)`       | **0 / 24**  | Skip    |
| `(auth)`      | **0 / 4**   | Skip    |
| `(team)`      | **0 / 6**   | Skip    |
| `(marketing)` | 3 / 7       | Partial |
| `(tools)`     | **13 / 14** | Add     |

Every `(app)` page is a synchronous wrapper — `dashboard/page.tsx` is literally
`return <PageClient />` — and the client component owns a skeleton already. A `loading.tsx` there
renders during the RSC round trip and is then immediately replaced by the page's own skeleton: two
loading UIs in sequence, which is precisely the naive outcome the backlog warned about. Same for
`(auth)` (forms) and `(team)`.

## Scope

Three files, each covering segments that genuinely block on server-side data:

- **`app/(tools)/loading.tsx`** — 13 of 14 pages are async. On a cache miss these await the op.gg
  meta snapshot, which is a multi-second network fetch; only the top ~50 champions are prerendered,
  so `builds/[champion]` and friends hit it for real.
- **`app/(marketing)/champions/loading.tsx`** — covers `/champions` and `/champions/[name]`.
- **`app/(marketing)/s/loading.tsx`** — the public summoner page, a live Riot API lookup and the
  slowest route in the app.

Deliberately **not** at `(marketing)` group level: that would put a skeleton in front of the landing
page, which is static and has its own poster-based LCP strategy (ADR-009).

Skeletons are shaped like the content they replace (breadcrumb, title, then table or card grid)
rather than a generic block, so the layout does not jump when real content arrives.

## Acceptance criteria

- [ ] Loading states only on segments whose server component actually awaits.
- [ ] No route shows two loading UIs in sequence.
- [ ] Verified in the browser on a real slow route.
- [ ] Full suite, typecheck, lint clean.
