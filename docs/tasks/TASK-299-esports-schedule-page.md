# TASK-299 — `/esports/schedule`

**Phase:** 6 — Esports & Audience Growth
**Status:** Done
**Estimated Effort:** 0.5 day
**Depends on:** TASK-298

---

## Objective

The full competitive calendar on one crawlable page — the highest-volume,
highest-recurrence query in the section ("lol esports schedule", "who plays
today").

## Scope

- **`app/(esports)/esports/schedule/page.tsx`** — `revalidate = 900`:
  - Matches grouped by day, day headers sticky on scroll, "today" anchored on
    load.
  - Each row: league badge, both teams (logo + code), kickoff in the viewer's
    local time, series format (Bo1/Bo3/Bo5), state (upcoming / live / final),
    and the score once played. Rows link to `/esports/matches/[matchId]`.
  - Past matches reachable by paging backwards; the default view is
    "yesterday → next 7 days" so the page has content in both directions.
- **League filter** — chips, not a `<select>` (the dashboard rebrand removed
  native selects for a reason). Selecting a league navigates to that league's hub
  (`/esports/leagues/[slug]`) rather than producing a filtered duplicate of this
  page — ADR-017 §3.
- **Time zone** — rendered from the client's zone in a small client component
  wrapping the timestamp; the server emits an ISO `datetime` attribute so the
  markup is stable and hydration-safe.
- Cross-links out: league hubs, and the hub page.

## Acceptance Criteria

- [x] Schedule renders grouped by day with correct local times
- [x] No paged URLs exist at all, so there is nothing to `noindex` — see below
- [x] League chips navigate to league hubs
- [x] No hydration mismatch on the day headings or the time column
- [x] Metadata + canonical + `ItemList` JSON-LD for the upcoming matches
- [x] Feed unreachable → empty state (same path proved in TASK-298); mobile clean
- [x] `tsc --noEmit`, lint and tests pass

## Notes from the build

- **Grouping happens twice, deliberately.** `groupByDay()` is pure and takes the
  zone and `now` as arguments: the server groups in UTC so the first paint is
  deterministic, and `ScheduleDays` re-groups in the reader's own zone on mount.
  Grouping only in UTC files a late-night match under tomorrow for anyone west of
  it; formatting the local day during render instead produces markup the server
  cannot match. Six unit tests cover the labels, the ordering, the zone
  difference and an unparseable timestamp.
- Verified in a browser against the live feed: Today / Tomorrow / dated headings
  with per-day counts, 156 matches across the 7-day horizon, no horizontal
  overflow, no hydration warning.
- The page is large (~156 rows). Every event also crosses into the client payload
  because the regrouping needs it. Worth a Lighthouse measurement in TASK-314
  before deciding whether the horizon should shorten.

## Deliberately not done

- **No backwards paging.** The scope called for it; instead the page shows
  fixtures for the next 7 days and results from the last 3, and points at the
  league pages for anything older. A paged archive would have meant query-param
  URLs that are near-duplicates of this page and have to be excluded from the
  index — and full history has a better home on the league and tournament pages
  (TASK-300/306), where it sits next to the standings that give it meaning.
