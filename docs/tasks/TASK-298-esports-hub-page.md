# TASK-298 — `/esports` hub, section chrome, navigation

**Phase:** 6 — Esports & Audience Growth
**Status:** Done
**Estimated Effort:** 1 day
**Depends on:** TASK-297
**Decisions:** [ADR-017](../adr/ADR-017-esports-url-structure.md)

---

## Objective

Ship the first public esports page: a hub that answers "what is on right now, what
is on today, and where do I go next", and the section chrome that every later
esports page renders inside.

## Scope

- **`app/(esports)/layout.tsx`** — mirrors `app/(tools)/layout.tsx`: `ToolsAppChrome`
  for signed-in users, `MarketingHeader`/`MarketingFooter` for everyone else, so
  the section is in-context for members and marketing-shaped for visitors.
- **`app/(esports)/esports/page.tsx`** — `revalidate = 300`:
  - **Live now** — anything in progress, with team logos, series score and the
    official watch link. Rendered server-side; the polling upgrade lands in
    TASK-304.
  - **Today and next 48 h** — grouped by day in the viewer's locale, league badge,
    kickoff time.
  - **Latest results** — last ~12 completed series.
  - **Leagues** — grid of major leagues linking to their hubs, ordered by the
    feed's priority.
  - Empty state that is a real state: off-season shows the next scheduled event
    and the league grid, not a spinner or a blank column.
- **`app/(esports)/esports/opengraph-image.tsx`** — section OG card via
  `renderOgImage`.
- **Navigation** — "Esports" in `MarketingHeader` `NAV`, in `MarketingFooter`, in
  the signed-in sidebar, and a card on the `/tools` hub.
- **`app/robots.ts`** — no change needed (the section is public); confirm no
  `disallow` rule catches `/esports`.
- **`next.config.mjs`** — add `static.lolesports.com` and
  `lolstatic-a.akamaihd.net` to `images.remotePatterns`, and to the CSP
  `img-src` allowlist. Team/league/player logos are served from both.
- **`app/sitemap.ts`** — add `/esports` (the rest of the section's URLs land in
  TASK-309).

## Design

LaneIQ system (ADR-015): chamfered panels, mono numerals for scores and clocks,
the accent rationed to live state only — a live match is the one thing on the page
allowed to use it.

## Acceptance Criteria

- [x] `/esports` renders live, upcoming, results and leagues from real feed data
- [x] Renders signed-out (marketing chrome); signed-in path reuses the same
      `ToolsAppChrome` split the Free Tools already ship
- [x] Team and league logos load through `next/image` with no CSP violation
- [x] Off-season / nothing-live state renders content, not an empty page
- [x] Cold cache + feed rejecting us → honest "temporarily unavailable" state,
      HTTP 200
- [x] Metadata: title, description, canonical `/esports`, OG card
- [x] Mobile checked at 390px — no horizontal overflow
- [x] Components under 200 lines; `tsc --noEmit`, lint and tests pass

## Notes from the build

Verified in a browser against the live feed (no database present, which also
exercised the fallback path — Prisma errors are swallowed by the cache layer and
the page still rendered).

- **Degradation proved, not assumed.** Restarted with `LOLESPORTS_API_KEY=bogus`,
  which the feed answers with 403: `/esports` returned **200** with the
  "temporarily unavailable" panel rather than an error page.
- **Two defects found and fixed by looking at it:**
  1. The kickoff time was printed twice on every upcoming row — once in the state
     column, once again with the date.
  2. On phones the league column was hidden entirely, so a row gave no clue which
     competition it belonged to. `MatchRow` is now a grid that reflows to
     league + kickoff on line one, teams on line two, with each element rendered
     once instead of duplicated behind visibility classes.
- `MatchTime` stacks the day above the clock: joined with a separator it wrapped
  in the narrow column and left a dangling "·" at the end of a line.
- Page title carries no brand suffix — the root layout's template appends one.
- **Onward links** (`/esports/schedule`, `/esports/leagues`, and match rows) are
  written but their targets land in TASK-299/300/303. `MatchRow` takes an optional
  `href` so making rows clickable is a one-line change at each call site.

## Deliberately not done

- **No day grouping on the hub.** The scope above said "grouped by day", but the
  server does not know the reader's time zone, so any grouping it renders is
  grouping by UTC — which puts a match into the wrong bucket for anyone far
  enough east or west. "Next up" is therefore a flat list with a dated kickoff on
  each row. Day grouping belongs on `/esports/schedule` (TASK-299), where it can
  be done on the client in the reader's own zone.
- **No watch link on live rows.** The scope mentioned one; the live surface is
  TASK-304's subject and the stream payload is better handled there in one place
  than half-added here.
