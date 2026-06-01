# TASK-008 — Product Completion & System Consistency Layer

**Phase:** 1 — MVP  
**Status:** Complete  
**Estimated Effort:** 0.5 day

---

## Objective

Polish the product UI to a consistent, production-grade standard. No new features — only standardizing loading, error, empty, and layout patterns across all existing pages.

---

## Acceptance Criteria

- [x] Global `ErrorState` component — standardized error display used in all pages
- [x] Global `EmptyState` component — standardized no-data display used in dashboard and report pages
- [x] `PageHeader` component — consistent title + subtitle + back link + action slot across all pages
- [x] `PageSkeleton` component — consistent full-page loading skeleton replacing one-off loading strings
- [x] Dashboard onboarding state — `EmptyState` with icon + CTA when no Riot account connected
- [x] Dashboard loading state — `PageSkeleton` instead of inline loading text
- [x] Dashboard profile error — `EmptyState` with sync CTA instead of inline `<div>`
- [x] Report detail page — `PageHeader` with back link, `PageSkeleton` loading, `ErrorState` for failures
- [x] Settings/Accounts page — `PageHeader` component replacing raw heading HTML
- [x] All three pages consistent: same loading → error → empty → content pattern

---

## Components Built

| Component | Path | Purpose |
|---|---|---|
| `ErrorState` | `src/components/ui/error-state.tsx` | Standardized error display with icon + retry |
| `EmptyState` | `src/components/ui/empty-state.tsx` | Standardized no-data state with icon + CTA |
| `PageHeader` | `src/components/layout/PageHeader.tsx` | Page title + subtitle + back link + action |
| `PageSkeleton` | `src/components/layout/PageSkeleton.tsx` | Full-page loading skeleton |

---

## Pages Updated

- `app/(app)/dashboard/page.tsx` — PageHeader, PageSkeleton, EmptyState (onboarding + no data)
- `app/(app)/coaching/[reportId]/page.tsx` — PageHeader (with back), PageSkeleton, ErrorState
- `app/(app)/settings/accounts/page.tsx` — PageHeader

---

## Notes

- `ErrorState` is a `"use client"` component (handles `onRetry` callback)
- `EmptyState` and `PageHeader` are server-compatible (no hooks or event handlers)
- No backend changes in this task
