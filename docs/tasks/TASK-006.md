# TASK-006 — Coaching Product Layer (User-Facing System)

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 2 days

---

## Objective

Build the user-facing product layer: dashboard with performance overview, coaching report list, report detail page, and the full API + React Query data layer to support them.

---

## Acceptance Criteria

- [x] `GET /api/coaching/reports` — list user's reports, optional `?riotAccountId` filter
- [x] `GET /api/coaching/reports/[reportId]` — fetch full report detail
- [x] `GET /api/riot/[riotAccountId]/performance` — fetch `PlayerPerformanceProfile`
- [x] `src/lib/api/fetcher.ts` — typed `apiFetch<T>` wrapper with `FetchError` class
- [x] `QueryProvider` — TanStack React Query singleton provider in `app/(app)/layout.tsx`
- [x] `useRiotAccounts` hook
- [x] `usePerformanceProfile` hook (stale after 5 min)
- [x] `useCoachingReports` hook (polls every 3s while any report is pending/processing)
- [x] `useCoachingReport` hook (polls every 3s while report is pending/processing)
- [x] `useGenerateReport` mutation hook (invalidates report list on success)
- [x] `src/types/coaching.frontend.ts` — frontend-safe `CoachingReportDetail` type
- [x] `PerformanceSummaryCards` — WR / KDA / CS/min / Playstyle cards with skeleton loading
- [x] `PerformanceTrendChart` — CSS bar chart (no library), last 10 games KDA + CS/min, green=win/red=loss
- [x] `RecentMatchList` — per-match rows with KDA, CS/min, W/L badge
- [x] `ReportList` — report rows with status badge; complete reports are links; polls while processing
- [x] `CoachingReportDetail` — full AI report display: summary, strengths, weaknesses (with priority), 3 action items, coach persona response
- [x] `/dashboard` page — account selector, performance section, trend chart, recent matches, report list + generate button
- [x] `/coaching/[reportId]` page — PageSkeleton loading, pending spinner, failed state, complete report view
- [x] `@tanstack/react-query` added to dependencies and documented in `DEPENDENCIES.md`

---

## Files Created

```
app/api/coaching/reports/route.ts
app/api/coaching/reports/[reportId]/route.ts
app/api/riot/[riotAccountId]/performance/route.ts
src/lib/api/fetcher.ts
src/components/providers/QueryProvider.tsx
src/components/ui/skeleton.tsx
src/hooks/useRiotAccounts.ts
src/hooks/usePerformanceProfile.ts
src/hooks/useCoachingReports.ts
src/hooks/useCoachingReport.ts
src/hooks/useGenerateReport.ts
src/types/coaching.frontend.ts
src/domains/analysis/components/PerformanceSummaryCards.tsx
src/domains/analysis/components/PerformanceTrendChart.tsx
src/domains/analysis/components/RecentMatchList.tsx
src/domains/coaching/components/ReportList.tsx
src/domains/coaching/components/CoachingReportDetail.tsx
app/(app)/coaching/[reportId]/page.tsx
```
