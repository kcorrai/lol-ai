# TASK-314 — Esports E2E coverage, docs and launch checklist

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 0.5 day
**Depends on:** TASK-309, TASK-310

---

## Objective

Close the section out: the tests that a stateless, feed-backed section actually
needs, the documentation the project requires as part of a deliverable, and a
launch check that the whole thing degrades honestly when the feed does not answer.

## Scope

- **E2E (`tests/e2e/esports.spec.ts`)** — the crawl path a visitor and a bot both
  take: hub → league → tournament → match → player → champion → `/builds/[champion]`.
  Asserts each page renders content and the breadcrumb trail is intact.
- **Degradation test** — with the feed mocked to fail and caches empty, every
  route returns 200 with an honest state and no unhandled error. This is the one
  failure mode the whole ADR-016 design exists for; it gets an explicit test.
- **Coverage** — domain services to the 80% bar in CLAUDE.md §5.2, route handler
  to 70%.
- **Docs**
  - `docs/API_DESIGN.md` — `/api/esports/live`.
  - `docs/FEATURES.md` — the esports feature entries.
  - `docs/PROJECT_STRUCTURE.md` — the `esports` domain and `(esports)` route group.
  - `.env.example` — `LOLESPORTS_API_KEY` (confirm TASK-297 landed it).
  - `docs/DEPENDENCIES.md` — only if a dependency was added; the plan assumes none.
- **Launch checklist**
  - [ ] Sitemap submitted; a sample of each page type passes Rich Results.
  - [ ] `noindex` audit: no filtered/sorted/paged/thin URL is indexable.
  - [ ] Lighthouse mobile LCP < 3 s on `/esports`, a team page and a match page.
  - [ ] "Not endorsed by Riot Games" and the data-source credit on every esports page.
  - [ ] No Riot host in any client-side request.
  - [ ] Redis/cache key growth measured over one match day and recorded.
  - [ ] Analytics: section pageviews, esports → builds click-through, and the
        TASK-311 funnel are all being recorded.

## Acceptance Criteria

- [ ] E2E crawl path and degradation specs pass in CI
- [ ] Coverage bars met for the esports domain and route handler
- [ ] All listed docs updated
- [ ] Every launch checklist item ticked or explicitly deferred with a reason
- [ ] `tsc --noEmit`, lint, unit and E2E tests pass
