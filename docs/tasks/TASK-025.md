# TASK-025 — Champion Focus AI Report

**Phase:** 2 — AI Depth & Retention
**Status:** In Progress
**Estimated Effort:** 1 day
**Depends on:** TASK-005 (coaching pipeline), TASK-V2-01 (champion pool page)

---

## Objective

Let users generate a champion-specific AI coaching report directly from the Champion Pool
page. The existing `champion_focus` report type and pipeline are already wired; this task
adds the UI trigger and the data plumbing to fetch the right match IDs.

---

## Acceptance Criteria

- [ ] GET `/api/riot/[riotAccountId]/champion-matches?champion=ChampionName` returns up to 10 ranked match IDs for that champion
- [ ] Each champion card on the Champion Pool page has an "Analyze" button
- [ ] Clicking "Analyze" generates a `champion_focus` report with `focusArea = championName`
- [ ] Button shows loading state during generation; success state with link to dashboard
- [ ] Free users can analyze their top 3 champions; Pro users all champions
- [ ] TypeScript clean, build passes
