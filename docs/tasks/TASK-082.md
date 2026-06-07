# TASK-082 â€” Daily & Weekly Challenge Sistemi

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 1.5 days  
**Priority:** P1

---

## Objective

OyuncularÄ±n her gÃ¼n veya her hafta tamamlayabileceÄŸi kÃ¼Ã§Ã¼k, AI Ã¼retilmiÅŸ
performans hedefleri oluÅŸtur. "BugÃ¼n 3 maÃ§ta 7.0+ CS/dk yap" gibi gÃ¶revler
platforma gÃ¼nlÃ¼k dÃ¶nme alÄ±ÅŸkanlÄ±ÄŸÄ± yaratÄ±r. Tamamlama â†’ XP + rozet tetikleme.

---

## User Story

> "Nereye odaklanacaÄŸÄ±mÄ± bilmiyorum. Birisi bana 'bugÃ¼n sadece ÅŸunu yap'
> dese ve tamamlayÄ±nca bir ÅŸey kazansam platforma her gÃ¼n gelirdim."

---

## Acceptance Criteria

- [ ] `Challenge` ve `UserChallenge` DB tablolarÄ± mevcut
- [ ] GÃ¼nlÃ¼k challenge: her sabah 08:00'de Inngest cron ile 1 challenge Ã¼retiliyor
- [ ] HaftalÄ±k challenge: her Pazartesi 08:00'de 1 challenge Ã¼retiliyor
- [ ] Challenge iÃ§eriÄŸi AI Ã¼retilmiÅŸ, kullanÄ±cÄ±nÄ±n zayÄ±f noktasÄ±na gÃ¶re kiÅŸiselleÅŸtirilmiÅŸ
- [ ] Dashboard'da "BugÃ¼nkÃ¼ GÃ¶revin" widget'Ä±
- [ ] MaÃ§ sync sonrasÄ± challenge tamamlanÄ±p tamamlanmadÄ±ÄŸÄ± kontrol ediliyor
- [ ] Tamamlama â†’ XP puanÄ± + achievementChecker tetiklenmesi
- [ ] Tamamlanan challenge'lar geÃ§miÅŸte gÃ¶rÃ¼nÃ¼yor
- [ ] Streak sistemi: 7 gÃ¼nlÃ¼k tamamlama serisi â†’ bonus rozet
- [ ] TypeScript strict â€” no `any`

---

## Technical Approach

### DB Schema

```prisma
model Challenge {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @db.Uuid
  type         String   // 'daily' | 'weekly'
  metric       String   // 'cs_per_min' | 'deaths' | 'vision_score' | 'win_streak' | 'kda'
  targetValue  Float
  description  String   // "3 maÃ§ta 7.0+ CS/dk yap"
  xpReward     Int
  validFrom    DateTime
  validUntil   DateTime
  createdAt    DateTime @default(now())

  userChallenges UserChallenge[]
  user           User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, type, validFrom])
  @@map("challenges")
}

model UserChallenge {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @db.Uuid
  challengeId String    @db.Uuid
  progress    Float     @default(0)   // 0.0 - 1.0
  completed   Boolean   @default(false)
  completedAt DateTime?
  createdAt   DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  challenge Challenge @relation(fields: [challengeId], references: [id], onDelete: Cascade)

  @@unique([userId, challengeId])
  @@map("user_challenges")
}
```

### XP Sistemi (Basit)

```prisma
// User modeline ekle:
xp        Int @default(0)
level     Int @default(1)   // her 500 XP = 1 level
```

Level hesabÄ±: `Math.floor(xp / 500) + 1`

### Challenge Ãœretim Servisi

```typescript
// src/domains/analysis/services/challengeService.ts

export async function generateDailyChallenge(userId: string, riotAccountId: string): Promise<Challenge>
export async function generateWeeklyChallenge(userId: string, riotAccountId: string): Promise<Challenge>
```

Ãœretim mantÄ±ÄŸÄ±:
1. KullanÄ±cÄ±nÄ±n son 14 gÃ¼nlÃ¼k en zayÄ±f metriÄŸini bul (habit detection'dan veya hesapla)
2. O metriÄŸe gÃ¶re challenge ÅŸablonu seÃ§
3. Target deÄŸeri kullanÄ±cÄ±nÄ±n mevcut ortalamasÄ±nÄ±n %10-15 Ã¼stÃ¼ne koy
4. AI ile TÃ¼rkÃ§e, motive edici aÃ§Ä±klama yaz

```typescript
const CHALLENGE_TEMPLATES = {
  cs_per_min:    { description: '{N} maÃ§ta {V}+ CS/dk yap', xp: 50 },
  deaths:        { description: '{N} maÃ§ta {V} veya daha az Ã¶lÃ¼m', xp: 60 },
  vision_score:  { description: '{N} maÃ§ta {V}+ vision score', xp: 40 },
  win_streak:    { description: 'Ãœst Ã¼ste {N} maÃ§ kazan', xp: 80 },
  kda:           { description: '{N} maÃ§ta {V}+ KDA yap', xp: 50 },
};
```

### Inngest Cron

```typescript
// src/inngest/functions/challengeGenerator.ts
export const dailyChallengeGenerator = inngest.createFunction(
  { id: 'daily-challenge-generator' },
  { cron: '0 8 * * *' }, // her gÃ¼n 08:00 UTC
  async ({ step }) => {
    // Aktif tÃ¼m kullanÄ±cÄ±lara challenge Ã¼ret
    const users = await step.run('fetch-active-users', () =>
      prisma.user.findMany({
        where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        include: { riotAccounts: { take: 1 } }
      })
    );
    // Fan-out: her kullanÄ±cÄ± iÃ§in ayrÄ± event
    await step.sendEvent('challenge/generate-for-users',
      users.map(u => ({ name: 'challenge/generate', data: { userId: u.id } }))
    );
  }
);
```

### Progress Tracking

MaÃ§ sync sonrasÄ±:
```typescript
// Aktif challenge'larÄ± kontrol et
// MetriÄŸi gÃ¼ncelle
// TamamlandÄ±ysa: completed = true, xp ekle, achievement tetikle
```

### Dashboard Widget

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  BugÃ¼nkÃ¼ GÃ¶rev âš¡                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  3 maÃ§ta 6.5+ CS/dk yap                 â”‚
â”‚  [â–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘] 1/3 tamamlandÄ±            â”‚
â”‚  Ã–dÃ¼l: +50 XP                           â”‚
â”‚                                          â”‚
â”‚  Sona eriyor: 11 saat 32 dakika         â”‚
â”‚                                          â”‚
â”‚  Bu haftanÄ±n gÃ¶revi:                     â”‚
â”‚  5 galibiyet serisine ulaÅŸ [0/5]        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### XP & Level Widget

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Seviye 7           â”‚
â”‚  [â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘] 420XP â”‚
â”‚  80 XP â†’ Seviye 8   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Files

```
prisma/schema.prisma                                         â† Challenge, UserChallenge, User.xp/level
prisma/migrations/YYYYMMDD_add_challenges/                   â† YENÄ°
src/domains/analysis/services/challengeService.ts            â† YENÄ°
src/inngest/functions/challengeGenerator.ts                  â† YENÄ° cron
src/inngest/functions/challengeProgressChecker.ts            â† YENÄ° (sync sonrasÄ±)
src/inngest/index.ts                                         â† function kaydet
src/components/dashboard/DailyChallengeWidget.tsx            â† YENÄ°
src/components/dashboard/XpLevelWidget.tsx                   â† YENÄ°
app/api/challenges/route.ts                                  â† GET aktif challengelar
app/api/challenges/[id]/progress/route.ts                    â† GET ilerleme
src/hooks/useChallenges.ts                                   â† YENÄ° TanStack Query
src/domains/riot/services/matchSyncService.ts                â† challenge progress check
app/(app)/dashboard/page.tsx                                 â† widgetlar ekle
```

---

## Tier Gating

- **Free:** GÃ¼nlÃ¼k 1 challenge
- **Pro:** GÃ¼nlÃ¼k + haftalÄ±k challenge + XP geÃ§miÅŸi
- **Elite:** Ã–zel challenge oluÅŸtur (AI ile)

---

## Test Plan

```typescript
describe('challengeService', () => {
  it('generateDailyChallenge: kullanÄ±cÄ±nÄ±n zayÄ±f metriÄŸine gÃ¶re seÃ§im yapÄ±lÄ±yor')
  it('target: mevcut ortalamanÄ±n %10-15 Ã¼stÃ¼nde')
  it('tamamlama: xp kullanÄ±cÄ±ya ekleniyor')
  it('aynÄ± gÃ¼n iki kez generate â†’ duplicate oluÅŸmuyor')
  it('challenge sÃ¼resi dolunca expired olarak iÅŸaretleniyor')
})
```

---

## Dependencies

- Inngest âœ…
- `challengeService` â†’ `habitDetectionService` verisini kullanÄ±r
- `achievementService` (TASK-078) â†’ challenge tamamlama achievement'Ä± tetikler

---

## Definition of Done

- Her gÃ¼n yeni challenge Ã¼retiliyor
- Progress maÃ§ sync ile gÃ¼ncelleniyor
- Dashboard widget Ã§alÄ±ÅŸÄ±yor
- XP sistemi iÅŸletiyor
- 7 gÃ¼nlÃ¼k streak rozeti verilebiliyor
- Unit test coverage â‰¥ 80%

