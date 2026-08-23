# TASK-232 — Report glows while generating + auto-opens on completion

## Status: In Progress

## Problem

After hitting a report type, the user can't tell what's happening or see the result — the pending
report row looks inert and completed reports must be clicked. Wanted: the row stays "bright"
(glowing) while it builds, and the report opens automatically when it completes.

## Fix

- `ReportList.ReportRow`: while `status` is `pending`/`processing`, apply a persistent
  `animate-glow-pulse` accent glow (reuse the existing keyframe) instead of the hover-only shadow.
- `coaching/PageClient.tsx`: capture the just-generated `reportId` from `generateReport.mutate(...,
{ onSuccess })`; a `useEffect` watching the polled reports (`useCoachingReports` already refetches
  every 3s while active) navigates `router.push('/coaching/'+reportId)` exactly once when that
  report flips to `complete`.

## Deliverables

- `src/domains/coaching/components/ReportList.tsx` (glow), `app/(app)/coaching/PageClient.tsx`
  (track + auto-open).

## Verification

Playwright: generate a report → row glows → on complete the app lands on `/coaching/<id>`.
