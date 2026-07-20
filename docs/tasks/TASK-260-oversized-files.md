# TASK-260 — Files over the CLAUDE.md size limits

Status: **open — not yet implemented**

## Problem
CLAUDE.md §3.3 sets: React component 200, service 250, utility 150, test 300. Twelve files exceed
their limit (measured with `wc -l`, classified by path):

| Lines / limit | File |
|---|---|
| 360 / 150 | `src/domains/onboarding/guide/guideSteps.ts` |
| 309 / 200 | `app/(app)/settings/billing/PageClient.tsx` |
| 304 / 200 | `app/(marketing)/s/[region]/[gameName]/[tagLine]/page.tsx` |
| 303 / 200 | `src/domains/coaching/pdf/ReportPDF.tsx` |
| 261 / 200 | `app/(app)/settings/privacy/PageClient.tsx` |
| 258 / 200 | `src/domains/coaching/components/CoachingReportDetail.tsx` |
| 256 / 200 | `app/(app)/dashboard/PageClient.tsx` |
| 249 / 200 | `src/domains/analysis/components/recap/recapSlides.tsx` |
| 236 / 200 | `app/(tools)/counters/[champion]/page.tsx` |
| 232 / 200 | `app/(app)/settings/security/TwoFactorSetup.tsx` |
| 217 / 200 | `src/domains/analysis/components/RecentMatchList.tsx` |
| 208 / 150 | `src/domains/onboarding/guide/useGuidedOnboarding.ts` |

## Priority
Not all overshoot is equal. Split by how much the file actually mixes concerns:

**Worth splitting now** — these interleave real logic with presentation:
- `guideSteps.ts` (360/150) — the worst overshoot. Largely a static step catalogue; splitting it by
  guide flow into `guide/steps/<flow>.ts` is mechanical and low risk.
- `TwoFactorSetup.tsx` (232/200) — enrolment, QR display, verification and recovery codes in one
  component; each is a testable step.
- `billing/PageClient.tsx` (309/200) — plan table, current-subscription panel, and invoice history are
  three independent sections.

**Leave alone for now** — length is inherent, not tangled:
- `ReportPDF.tsx` (303/200) is a react-pdf document; splitting it fragments a single layout.
- `recapSlides.tsx` (249/200) is a slide catalogue, same shape as `guideSteps`.

Per CLAUDE.md §2.1 this is refactor-only work and must not be bundled with feature changes — one
commit per file split.

## Note
An earlier automated pass reported these `app/**/page.tsx` and `PageClient.tsx` files against the
80-line *API route handler* limit and called them ~229 lines over. That classification was wrong:
they are components, so the limit is 200. The table above is the corrected measurement.

refs TASK-260
