# TASK-299 — `/esports/schedule`

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
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

- [ ] Schedule renders grouped by day with correct local times
- [ ] Backwards/forwards paging works and does not create indexable duplicates
      (`noindex, follow` on any paged view; canonical → `/esports/schedule`)
- [ ] League chips navigate to league hubs
- [ ] No hydration mismatch on the time column
- [ ] Metadata + canonical + `ItemList` JSON-LD for the day's matches
- [ ] Feed unreachable → last-good with "as of"; mobile clean at 390px
- [ ] `tsc --noEmit`, lint and tests pass
