# TASK-027 — Climb Roadmap AI Report UI

**Phase:** 2 — AI Depth & Retention
**Status:** In Progress
**Estimated Effort:** 0.5 day
**Depends on:** TASK-005 (coaching pipeline)

---

## Objective

Surface the existing `climb_roadmap` report type in the dashboard UI.
The pipeline and prompt are already complete; this task adds the trigger button and
a dedicated section on the report detail page to highlight rank potential and
champion recommendations — the outputs that are unique to this report type.

---

## Acceptance Criteria

- [ ] Dashboard shows a "Climb Roadmap" button alongside "Generate Report"
- [ ] Uses last 10 ranked matches (vs 5 for session review)
- [ ] Report detail page highlights estimatedRankPotential + championRecommendations prominently for climb_roadmap reports
- [ ] TypeScript clean, build passes
