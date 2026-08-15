# TASK-298 — `/esports` hub, section chrome, navigation

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
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

- [ ] `/esports` renders live, upcoming, results and leagues from real feed data
- [ ] Renders correctly signed-in (app chrome) and signed-out (marketing chrome)
- [ ] Team and league logos load through `next/image` with no CSP violation
- [ ] Off-season / nothing-live state renders content, not an empty page
- [ ] Feed unreachable → last-good data with an "as of" timestamp; cold cache →
      an honest "esports data is temporarily unavailable" state, HTTP 200
- [ ] Metadata: title, description, canonical `/esports`, OG card
- [ ] Mobile checked at 390px — no horizontal overflow
- [ ] Components under 200 lines; `tsc --noEmit`, lint and tests pass
