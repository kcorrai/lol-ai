# TASK-165: Takım Aktivite Akışı

## Status: Pending
## Score: 60/100

## Goal
/teams/[teamId]/activity sayfası — kim maç oynadı, rank atladı,
takıma katıldı gibi aktivitelerin basit feed'i. Inngest rank/changed
ve match/session.synced eventleri zaten var, sadece log + UI gerekiyor.

## Scope
- Prisma: `TeamActivity` modeli (teamId, userId, type, payload, createdAt)
- `src/domains/teams/services/teamActivityService.ts` — logActivity(), getTeamActivity()
- Inngest: rank/changed ve match/session.synced handler'larına takım aktivite logu ekle
- `app/api/teams/[teamId]/activity/route.ts` — son 50 aktiviteyi döner
- `src/hooks/useTeamActivity.ts`
- `app/(team)/teams/[teamId]/activity/page.tsx` — aktivite feed sayfası
- `src/domains/teams/components/TeamActivityFeed.tsx`
- TeamSidebar'a "Aktivite" nav linki ekle

## Out of Scope
- Real-time (websocket) aktivite push
- Aktivite bildirimleri (email/push)
