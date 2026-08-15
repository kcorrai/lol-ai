# TASK-307: `/draft` is redirected away, so the draft room is unreachable

## Symptom

`app/(tools)/draft/page.tsx` shipped in TASK-301 and renders correctly, but
nobody can reach it. Every request to `/draft` answers `308` and lands on
`/tools/draft-analyzer`:

```
GET http://localhost:3001/draft
  → 308 → /tools/draft-analyzer  (200)
```

The room itself works — the collision is only on the create page's URL:

```
POST /api/draft                     → 201
POST /api/draft/<code>/ready  (x2)  → phase=IN_PROGRESS, step=0
POST /api/draft/<code>/action       → step=1, Ahri banned
POST /api/draft/<code>/action       → 409 "not-your-turn"
GET  /draft/<code>                  → 200
```

## Root cause

`next.config.mjs:54` carries a redirect predating this feature:

```js
{ source: "/draft", destination: "/tools/draft-analyzer", permanent: true },
```

It belongs to a set that moved old authed tool routes onto public `/tools/*`
keyword URLs. `/draft` was a free URL at the time. TASK-301 then claimed it for
the create page without checking, and a `redirects()` entry wins over a page —
so the page is dead code in production.

`/draft/<code>` is unaffected: the `source` matches the exact path only.

## Fix

Delete the `/draft` entry. The other two stay: nothing has claimed `/counter` or
`/matchup`.

`/draft` is the right home for the room — it is the URL people will guess, and
the analyser keeps its own `/tools/draft-analyzer` address, which is where every
internal link already points.

## Consequence worth knowing

The redirect was `permanent: true`, which is a `308`. Browsers cache those
aggressively and often indefinitely. Anyone who has hit `/draft` on this origin
before this fix will keep being sent to the analyser until they clear their
cache — including us, in local development. Search engines that recorded the
permanent move need to recrawl.

A `307` would have been reversible. That is an argument for defaulting to
`permanent: false` on any redirect covering a URL we might want back, but
changing the two remaining entries is out of scope here.

## Done when

- `GET /draft` returns `200` and renders the create form.
- `GET /draft/<code>` still returns `200`.
- `/tools/draft-analyzer` still returns `200` and is still linked from `/tools`.
- A regression test pins the create page's route, so the next redirect added to
  `next.config.mjs` cannot silently swallow it again.
