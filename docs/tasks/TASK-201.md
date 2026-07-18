# TASK-201: File-size compliance sweep (24 files)

## Status: Done

## Goal
Bring every file over its CLAUDE.md 3.3 size limit back under it by extracting
cohesive sub-responsibilities. No behavior change; each file split is its own
commit, verified with `tsc --noEmit`, `next lint`, and `vitest run`.

## Limits
React component 200 · Service 250 · API route 80 · Utility 150.

## Files (current lines → target)

### Services (>250)
- [x] challengeService.ts (391) — DEAD CODE, deleted. Already superseded by
      challengeGenerationService.ts (149) + challengeProgressService.ts (123) +
      challengeConstants.ts; nothing imported the monolith.
- [x] teamService.ts (376) → 223; extracted getTeamDashboard to teamDashboardService.ts (159)
- [x] weeklyEmailRenderer.ts (279) → 147; extracted renderWeeklyEmail to weeklyEmailTemplate.ts (133)
- [x] draftEvalService.ts (271) → 129; extracted draftTeamEval.ts (121) + draftEval.types.ts (44)
- [x] masteryScoreService.ts (268) → 155; extracted pure math to masteryScoring.ts (128)
- [x] improvementPlanService.ts (255) → 85; extracted improvementPlanCompute.ts (179)
- [x] cardService.ts (252) → 58; extracted cardDataBuilders.ts (168) + card.types.ts (29)

### API routes (>80)
- [x] cards/[token]/route.tsx (260) → 38; extracted OG templates (weeklyCardOg 111, masteryCardOg 94, cardOgTokens 17)
- [x] og/report/[shareToken]/route.tsx (188) → 29; extracted reportOgTemplate.tsx (162)
- [x] public/preview/route.ts (187) → 57; extracted buildAccountPreview to domains/riot/services/previewService.ts (142)
- [x] achievements/share/[achievementId]/route.tsx (139) → 30; extracted achievementOgTemplate.tsx (124)
- [x] riot/[riotAccountId]/chat/route.ts (127) → 65; extracted coachChatService.ts (71)
- [x] auth/register/route.ts (105) → 43; extracted registrationService.ts (80)
- [x] coaching/reports/[reportId]/stream/route.ts (101) → 34; extracted reportStatusStream.ts (73)
- [x] lemonsqueezy/webhook/route.ts (89) → 61; extracted lsWebhookDispatch.ts (38)

### Utilities (>150)
- [x] lib/lemonsqueezy/subscriptionService.ts (277) → 92; extracted lsCheckout.ts (71) + lsWebhookVerify.ts (39) + lsSubscriptionSync.ts (55)
- [x] lib/email/templates/teamSubscriptionNotification.ts (174) → 84 (shared emailShell.ts 58)
- [x] lib/ddragon.ts (166) → 75; extracted ddragonRunes.ts (101) + ddragonVersion.ts (4)
- [x] lib/auth/authorization.ts (159) → 83; extracted planLimits.ts (81)
- [x] lib/api/rateLimit.ts (159) → 71; extracted rateLimitBackends.ts (93)
- [x] lib/email/templates/reengagement.ts (156) → 105 (shared emailShell)
- [x] lib/email/templates/monthlyMilestone.ts (154) → 147 (shared escapeHtml)

### Components (>200)
- [x] layout/TeamSidebar.tsx (221) → 149; extracted TeamSwitcher.tsx (93)
- [x] shared/ChampionSelector.tsx (209) → 190; extracted useAllChampions hook to src/hooks (22)

## Note
Line counts are pre-refactor. Each commit references TASK-201 and checks the box.
