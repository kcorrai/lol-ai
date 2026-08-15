# TASK-306 — Tournament pages and brackets

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 1 day
**Depends on:** TASK-300

---

## Objective

A page per tournament/split — the entity people actually search during the
season's peaks ("worlds 2026 bracket", "msi results", "lec split 3 standings")
and the container the pro-meta aggregation (TASK-307) is computed over.

## Scope

- **`app/(esports)/esports/tournaments/[slug]/page.tsx`** — `revalidate = 3600`,
  `generateStaticParams` from the tournaments of the major leagues:
  - Header: tournament name, league, dates, current stage, champion once decided.
  - **Standings** for group/round-robin stages (reuses `standingsService`).
  - **Bracket** for elimination stages — a real bracket, rendered as a CSS grid
    of rounds with connector rules, horizontally scrollable inside its own
    container on mobile (never widening the page — TASK-296's lesson).
  - **All matches** for the tournament, grouped by stage and week.
  - Link to the tournament's champion meta (TASK-307) once it exists.
- Multi-stage formats (play-in → swiss → knockout) render each stage in order,
  with stages the normaliser did not recognise skipped rather than fatal.
- Slug from the feed (`lec_split_3_2026`); unknown slug → `notFound()`.

## Acceptance Criteria

- [ ] `/esports/tournaments/[slug]` renders header, stages, standings and bracket
- [ ] Verified against a round-robin split, a swiss stage and a knockout bracket
- [ ] Bracket scrolls inside its container; page body never scrolls horizontally
      at 390px
- [ ] Completed tournaments show the winner; live ones show the current stage
- [ ] `SportsEvent` + `ItemList` JSON-LD; breadcrumbs league → tournament
- [ ] Bracket component under 200 lines
- [ ] `tsc --noEmit`, lint and tests pass
