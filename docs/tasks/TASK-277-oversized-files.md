# TASK-277 — Files over the CLAUDE.md size limits

## Status: Partially done — one file fixed, the rest deliberately left. Read before re-filing.

`docs/BACKLOG-SCORED-2026-07-20.md` finding #15 (score 34, the lowest in the backlog), which already
says "Only some are worth splitting — `ReportPDF` and `recapSlides` are inherently long catalogues,
not tangled logic."

## Measured today

20 files exceed their §3.3 limit. The distribution matters more than the count:

| Over by        | Count | Examples                                                                           |
| -------------- | ----- | ---------------------------------------------------------------------------------- |
| **1–11 lines** | 8     | `RankedCard.tsx` 202/200, `teamRepository.ts` 153/150, `matchMapper.ts` 155/150    |
| 17–68 lines    | 9     | `RecentMatchList.tsx` 217/200, `CoachingReportDetail.tsx` 258/200                  |
| 100+ lines     | 3     | `guideSteps.ts` 360/150, `billing/PageClient.tsx` 309/200, `ReportPDF.tsx` 303/200 |

## What was fixed, and why only this one

**`app/api/coaching/generate/route.ts` — 82/80.** This one was mine: TASK-267 pushed it over while
closing the quota race. It was also violating a second and more important rule, §2.2 "no business
logic in API route handlers" — the handler was taking the per-user lock, re-checking quota and
inserting, which is the rule "a report may only exist if quota permits it".

Extracting `createPendingReportWithinQuota` into `reportService` fixes both at once: the route is
79 lines and now validates, delegates and responds, and callers get quota enforcement by
construction rather than by remembering to take the lock. The atomicity tests moved from the route
test to a service test, which is where they belonged — 6 of them, asserting the check happens
before the insert and both hit the same transaction client.

That is the difference between a real fix and line-count churn: the number was a symptom of a
layering violation, so fixing the layering fixed the number.

## Why the other 19 are left alone

- **Eight are 1–11 lines over.** Splitting a 202-line component to satisfy a 200-line limit produces
  two files, an extra import, and no improvement in comprehensibility. The limit exists to catch
  design smells (§3.3 calls them exactly that), and 2 lines is not a design smell.
- **The large ones are mostly catalogues, not logic.** `guideSteps.ts` is a list of onboarding
  steps; `ReportPDF.tsx` and `recapSlides.tsx` are layout declarations. Splitting a flat list across
  files makes it harder to read, not easier. Note also that `guideSteps.ts` is measured against the
  150-line **utility** limit, which is arguably the wrong category — the same mistake an automated
  pass made in TASK-250 when it judged components against the 80-line API-route limit.
- **Refactoring for its own sake carries regression risk with no test coverage to catch it.** The
  files with real logic worth splitting (`billing/PageClient.tsx`, `CoachingReportDetail.tsx`) have
  no component tests. Restructuring them blind is a worse trade than leaving them, and the backlog
  itself says these must be refactor-only commits — meaning each is its own task, with its own
  tests written first.

**Recommendation:** treat the remaining 19 as a standing observation, not a work item. If one of the
large components is being modified for a real feature anyway, split it _then_, with tests. Do not
schedule a sweep.
