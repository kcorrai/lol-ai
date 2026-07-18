# TASK-201: File-size compliance sweep (24 files)

## Status: In Progress

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
- [ ] masteryScoreService.ts (268)
- [ ] improvementPlanService.ts (255)
- [ ] cardService.ts (252)

### API routes (>80)
- [ ] cards/[token]/route.tsx (260)
- [ ] og/report/[shareToken]/route.tsx (188)
- [ ] public/preview/route.ts (187)
- [ ] achievements/share/[achievementId]/route.tsx (139)
- [ ] riot/[riotAccountId]/chat/route.ts (127)
- [ ] auth/register/route.ts (105)
- [ ] coaching/reports/[reportId]/stream/route.ts (101)
- [ ] lemonsqueezy/webhook/route.ts (89)

### Utilities (>150)
- [ ] lib/lemonsqueezy/subscriptionService.ts (277)
- [ ] lib/email/templates/teamSubscriptionNotification.ts (174)
- [ ] lib/ddragon.ts (166)
- [ ] lib/auth/authorization.ts (159)
- [ ] lib/api/rateLimit.ts (159)
- [ ] lib/email/templates/reengagement.ts (156)
- [ ] lib/email/templates/monthlyMilestone.ts (154)

### Components (>200)
- [ ] layout/TeamSidebar.tsx (221)
- [ ] shared/ChampionSelector.tsx (209)

## Note
Line counts are pre-refactor. Each commit references TASK-201 and checks the box.
