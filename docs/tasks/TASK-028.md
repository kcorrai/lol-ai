# TASK-028 — Coaching Report PDF Export

**Phase:** 2 — AI Depth & Retention
**Status:** In Progress
**Estimated Effort:** 1 day
**Depends on:** TASK-005 (coaching pipeline), TASK-006 (report detail page)

---

## Objective

Allow users to download their completed coaching reports as a PDF.
The PDF includes all report sections and is gated: Free users get summary + action items,
Pro users get the full report including strengths, weaknesses, and recommendations.

---

## Acceptance Criteria

- [ ] `GET /api/coaching/reports/[reportId]/pdf` streams a PDF response
- [ ] PDF contains: header, player info, summary, action items, rank potential (if climb_roadmap)
- [ ] Pro users also get: strengths, weaknesses, champion recommendations
- [ ] "Download PDF" button on the report detail page (complete reports only)
- [ ] `@react-pdf/renderer` added to DEPENDENCIES.md
- [ ] TypeScript clean, build passes
