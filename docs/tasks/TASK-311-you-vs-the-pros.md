# TASK-311 — "You vs the pros" comparison

**Phase:** 6 — Esports & Audience Growth
**Status:** Planned
**Estimated Effort:** 1 day
**Depends on:** TASK-308

---

## Objective

The conversion step. A visitor reading how a pro plays a champion should be able
to see, in one click, how their own play differs — which is the product's core
promise, delivered on a page they arrived at from a search about someone else.

Extends the existing `F-017 Pro Player Comparison`, which today compares against
Master+ aggregates from our own database (`proComparisonService`). This adds the
actual-pro benchmark.

## Scope

- **Signed out** — on `/esports/champions/[champion]`, a Riot ID input:
  "You play Azir. How do you compare?" Submitting runs the existing public
  analyse flow (`AnalyzeForm` precedent on the landing page) and lands on a
  comparison view.
- **Signed in** — the same module resolves the active Riot account automatically
  and renders the comparison inline.
- **The comparison** — for the champion, side by side: CS/min, gold/min, KDA,
  kill participation, damage share, vision score. Pro column is the aggregate
  from `proMetaService`/`gameStatsService` (with sample size); player column is
  their own games on that champion. Each row shows the gap and a one-line reading
  of what the gap means, from existing analysis copy — **not** a new AI call.
- **Honesty rules, non-negotiable:**
  - Pro games are 30-minute Bo5 stage games; ranked solo queue is not. State the
    comparison's limits in one line rather than implying the numbers are like-for-like.
  - Fewer than three player games on the champion → say so and compare anyway,
    labelled.
  - No pro sample → the module does not render.
- CTA into the product: "Get the full breakdown" → register/dashboard.
- Reuses `proComparisonService` where the maths already exists; the esports
  benchmark enters through `src/domains/esports/index.ts`.

## Acceptance Criteria

- [ ] Comparison renders for a signed-in user with games on the champion
- [ ] Signed-out Riot ID flow works end to end and is rate limited
- [ ] Sample sizes shown for both columns; the format caveat is visible, not a
      tooltip
- [ ] No AI call in this path — zero marginal cost per view
- [ ] Analytics event on submit and on CTA click, so the funnel is measurable
- [ ] Unit tests for the gap calculation and the low-sample labelling
- [ ] Components under 200 lines; `tsc --noEmit`, lint and tests pass
