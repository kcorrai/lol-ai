# Diff Details

Date : 2026-07-19 14:38:16

Directory c:\\Users\\kaana\\OneDrive\\Belgeler\\kcorrai-coding\\lol-ai

Total : 59 files,  653 codes, 105 comments, 199 blanks, all 957 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [app/(app)/achievements/AchievementsPreview.tsx](/app/(app)/achievements/AchievementsPreview.tsx) | TypeScript JSX | 64 | 3 | 7 | 74 |
| [app/(app)/achievements/PageClient.tsx](/app/(app)/achievements/PageClient.tsx) | TypeScript JSX | 4 | 1 | 1 | 6 |
| [app/(app)/dashboard/PageClient.tsx](/app/(app)/dashboard/PageClient.tsx) | TypeScript JSX | -7 | 1 | 0 | -6 |
| [app/(app)/improvement/ImprovementHistoryPreview.tsx](/app/(app)/improvement/ImprovementHistoryPreview.tsx) | TypeScript JSX | 63 | 3 | 8 | 74 |
| [app/(app)/improvement/PageClient.tsx](/app/(app)/improvement/PageClient.tsx) | TypeScript JSX | 7 | 0 | 0 | 7 |
| [app/(app)/layout.tsx](/app/(app)/layout.tsx) | TypeScript JSX | 8 | 3 | 1 | 12 |
| [app/(app)/leaderboard/LeaderboardPreview.tsx](/app/(app)/leaderboard/LeaderboardPreview.tsx) | TypeScript JSX | 99 | 3 | 12 | 114 |
| [app/(app)/leaderboard/PageClient.tsx](/app/(app)/leaderboard/PageClient.tsx) | TypeScript JSX | 7 | 0 | 0 | 7 |
| [app/(app)/onboarding/PageClient.tsx](/app/(app)/onboarding/PageClient.tsx) | TypeScript JSX | -166 | 0 | -16 | -182 |
| [app/(app)/onboarding/page.tsx](/app/(app)/onboarding/page.tsx) | TypeScript JSX | -2 | 3 | -1 | 0 |
| [app/api/coaching/generate/route.ts](/app/api/coaching/generate/route.ts) | TypeScript | -5 | 4 | -1 | -2 |
| [app/api/onboarding/complete/route.ts](/app/api/onboarding/complete/route.ts) | TypeScript | 9 | 1 | 3 | 13 |
| [app/api/riot/\[riotAccountId\]/sync/route.ts](/app/api/riot/%5BriotAccountId%5D/sync/route.ts) | TypeScript | 4 | 3 | 0 | 7 |
| [docs/API\_DESIGN.md](/docs/API_DESIGN.md) | Markdown | 10 | 0 | 5 | 15 |
| [docs/DATABASE\_SCHEMA.md](/docs/DATABASE_SCHEMA.md) | Markdown | 1 | 0 | 0 | 1 |
| [docs/adr/ADR-010-guided-onboarding.md](/docs/adr/ADR-010-guided-onboarding.md) | Markdown | 39 | 0 | 9 | 48 |
| [docs/tasks/TASK-217-forced-onboarding.md](/docs/tasks/TASK-217-forced-onboarding.md) | Markdown | 35 | 0 | 14 | 49 |
| [docs/tasks/TASK-218-onboarding-per-user-progress.md](/docs/tasks/TASK-218-onboarding-per-user-progress.md) | Markdown | 29 | 0 | 14 | 43 |
| [docs/tasks/TASK-219-content-rich-onboarding-previews.md](/docs/tasks/TASK-219-content-rich-onboarding-previews.md) | Markdown | 38 | 0 | 14 | 52 |
| [docs/tasks/TASK-220-onboarding-trap-fixes.md](/docs/tasks/TASK-220-onboarding-trap-fixes.md) | Markdown | 37 | 0 | 14 | 51 |
| [docs/tasks/TASK-221-tilt-block-and-auto-sync.md](/docs/tasks/TASK-221-tilt-block-and-auto-sync.md) | Markdown | 30 | 0 | 12 | 42 |
| [docs/tasks/TASK-222-allow-shared-riot-accounts.md](/docs/tasks/TASK-222-allow-shared-riot-accounts.md) | Markdown | 22 | 0 | 12 | 34 |
| [docs/tasks/TASK-223-inngest-in-process-fallback.md](/docs/tasks/TASK-223-inngest-in-process-fallback.md) | Markdown | 25 | 0 | 11 | 36 |
| [docs/tasks/TASK-224-no-email-verify-for-report-gen.md](/docs/tasks/TASK-224-no-email-verify-for-report-gen.md) | Markdown | 14 | 0 | 8 | 22 |
| [prisma/migrations/20260718000001\_add\_onboarding\_completed/migration.sql](/prisma/migrations/20260718000001_add_onboarding_completed/migration.sql) | MS SQL | 1 | 1 | 1 | 3 |
| [prisma/seed.ts](/prisma/seed.ts) | TypeScript | 21 | 3 | 2 | 26 |
| [src/components/layout/AppShell.tsx](/src/components/layout/AppShell.tsx) | TypeScript JSX | 11 | 0 | 0 | 11 |
| [src/components/onboarding/tour/CoachMascot.tsx](/src/components/onboarding/tour/CoachMascot.tsx) | TypeScript JSX | -97 | -5 | -12 | -114 |
| [src/components/onboarding/tour/CoachTour.tsx](/src/components/onboarding/tour/CoachTour.tsx) | TypeScript JSX | -85 | -8 | -14 | -107 |
| [src/components/onboarding/tour/Confetti.tsx](/src/components/onboarding/tour/Confetti.tsx) | TypeScript JSX | -23 | -2 | -2 | -27 |
| [src/components/onboarding/tour/SpotlightOverlay.tsx](/src/components/onboarding/tour/SpotlightOverlay.tsx) | TypeScript JSX | -34 | -6 | -4 | -44 |
| [src/components/onboarding/tour/tourSteps.ts](/src/components/onboarding/tour/tourSteps.ts) | TypeScript | -70 | -8 | -5 | -83 |
| [src/domains/analysis/components/RecentMatchList.tsx](/src/domains/analysis/components/RecentMatchList.tsx) | TypeScript JSX | 1 | 1 | 0 | 2 |
| [src/domains/analysis/components/TiltBreakModal.tsx](/src/domains/analysis/components/TiltBreakModal.tsx) | TypeScript JSX | 2 | 2 | 0 | 4 |
| [src/domains/onboarding/OnboardingFlow.tsx](/src/domains/onboarding/OnboardingFlow.tsx) | TypeScript JSX | -194 | -2 | -18 | -214 |
| [src/domains/onboarding/guide/CoachBubble.tsx](/src/domains/onboarding/guide/CoachBubble.tsx) | TypeScript JSX | 105 | 8 | 13 | 126 |
| [src/domains/onboarding/guide/Confetti.tsx](/src/domains/onboarding/guide/Confetti.tsx) | TypeScript JSX | 23 | 1 | 2 | 26 |
| [src/domains/onboarding/guide/GuidedOnboarding.tsx](/src/domains/onboarding/guide/GuidedOnboarding.tsx) | TypeScript JSX | 27 | 4 | 6 | 37 |
| [src/domains/onboarding/guide/SpotlightOverlay.tsx](/src/domains/onboarding/guide/SpotlightOverlay.tsx) | TypeScript JSX | 36 | 13 | 8 | 57 |
| [src/domains/onboarding/guide/guideSteps.test.ts](/src/domains/onboarding/guide/guideSteps.test.ts) | TypeScript | 84 | 9 | 14 | 107 |
| [src/domains/onboarding/guide/guideSteps.ts](/src/domains/onboarding/guide/guideSteps.ts) | TypeScript | 177 | 15 | 9 | 201 |
| [src/domains/onboarding/guide/useGuidedOnboarding.ts](/src/domains/onboarding/guide/useGuidedOnboarding.ts) | TypeScript | 142 | 19 | 22 | 183 |
| [src/domains/onboarding/onboardingService.test.ts](/src/domains/onboarding/onboardingService.test.ts) | TypeScript | 46 | 0 | 14 | 60 |
| [src/domains/onboarding/onboardingService.ts](/src/domains/onboarding/onboardingService.ts) | TypeScript | 29 | 5 | 6 | 40 |
| [src/domains/onboarding/preview/OnboardingPreviewContext.tsx](/src/domains/onboarding/preview/OnboardingPreviewContext.tsx) | TypeScript JSX | 22 | 3 | 6 | 31 |
| [src/domains/onboarding/preview/PreviewBadge.tsx](/src/domains/onboarding/preview/PreviewBadge.tsx) | TypeScript JSX | 16 | 2 | 3 | 21 |
| [src/domains/riot/components/AccountConnectionForm.tsx](/src/domains/riot/components/AccountConnectionForm.tsx) | TypeScript JSX | 0 | 2 | 0 | 2 |
| [src/domains/riot/services/accountService.ts](/src/domains/riot/services/accountService.ts) | TypeScript | -9 | 1 | 0 | -8 |
| [src/domains/riot/services/matchSyncService.ts](/src/domains/riot/services/matchSyncService.ts) | TypeScript | 28 | 3 | 5 | 36 |
| [src/hooks/useAutoSync.test.ts](/src/hooks/useAutoSync.test.ts) | TypeScript | 21 | 0 | 6 | 27 |
| [src/hooks/useAutoSync.ts](/src/hooks/useAutoSync.ts) | TypeScript | 28 | 7 | 6 | 41 |
| [src/hooks/useCompleteOnboarding.ts](/src/hooks/useCompleteOnboarding.ts) | TypeScript | 11 | 2 | 4 | 17 |
| [src/hooks/useOnboardingFlow.ts](/src/hooks/useOnboardingFlow.ts) | TypeScript | -76 | -4 | -16 | -96 |
| [src/inngest/functions/matchSync.ts](/src/inngest/functions/matchSync.ts) | TypeScript | -36 | 0 | -7 | -43 |
| [src/lib/inngest/dispatch.test.ts](/src/lib/inngest/dispatch.test.ts) | TypeScript | 32 | 0 | 13 | 45 |
| [src/lib/inngest/dispatch.ts](/src/lib/inngest/dispatch.ts) | TypeScript | 18 | 8 | 3 | 29 |
| [tests/e2e/global-setup.ts](/tests/e2e/global-setup.ts) | TypeScript | 0 | 2 | 0 | 2 |
| [tests/e2e/guided-onboarding.spec.ts](/tests/e2e/guided-onboarding.spec.ts) | TypeScript | 49 | 10 | 14 | 73 |
| [tests/e2e/tour.spec.ts](/tests/e2e/tour.spec.ts) | TypeScript | -18 | -6 | -7 | -31 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details