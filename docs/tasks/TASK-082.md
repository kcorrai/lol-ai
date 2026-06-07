# TASK-082 — Daily & Weekly Challenge Sistemi

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 1.5 days  
**Priority:** P1

---

## Objective

Oyuncuların her gün veya her hafta tamamlayabileceği küçük, AI üretilmiş
performans hedefleri oluştur. "Bugün 3 maçta 7.0+ CS/dk yap" gibi görevler
platforma günlük dönme alışkanlığı yaratır. Tamamlama → XP + rozet tetikleme.

---

## User Story

> "Nereye odaklanacağımı bilmiyorum. Birisi bana 'bugün sadece şunu yap'
> dese ve tamamlayınca bir şey kazansam platforma her gün gelirdim."

---

## Acceptance Criteria

- [ ] `Challenge` ve `UserChallenge` DB tabloları mevcut
- [ ] Günlük challenge: her sabah 08:00'de Inngest cron ile 1 challenge üretiliyor
- [ ] Haftalık challenge: her Pazartesi 08:00'de 1 challenge üretiliyor
- [ ] Challenge içeriği AI üretilmiş, kullanıcının zayıf noktasına göre kişiselleştirilmiş
- [ ] Dashboard'da "Bugünkü Görevin" widget'ı
- [ ] Maç sync sonrası challenge tamamlanıp tamamlanmadığı kontrol ediliyor
- [ ] Tamamlama → XP puanı + achievementChecker tetiklenmesi
- [ ] Tamamlanan challenge'lar geçmişte görünüyor
- [ ] Streak sistemi: 7 günlük tamamlama serisi → bonus rozet
- [ ] TypeScript strict — no `any`

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
  description  String   // "3 maçta 7.0+ CS/dk yap"
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

Level hesabı: `Math.floor(xp / 500) + 1`

### Challenge Üretim Servisi

```typescript
// src/domains/analysis/services/challengeService.ts

export async function generateDailyChallenge(userId: string, riotAccountId: string): Promise<Challenge>
export async function generateWeeklyChallenge(userId: string, riotAccountId: string): Promise<Challenge>
```

Üretim mantığı:
1. Kullanıcının son 14 günlük en zayıf metriğini bul (habit detection'dan veya hesapla)
2. O metriğe göre challenge şablonu seç
3. Target değeri kullanıcının mevcut ortalamasının %10-15 üstüne koy
4. AI ile Türkçe, motive edici açıklama yaz

```typescript
const CHALLENGE_TEMPLATES = {
  cs_per_min:    { description: '{N} maçta {V}+ CS/dk yap', xp: 50 },
  deaths:        { description: '{N} maçta {V} veya daha az ölüm', xp: 60 },
  vision_score:  { description: '{N} maçta {V}+ vision score', xp: 40 },
  win_streak:    { description: 'Üst üste {N} maç kazan', xp: 80 },
  kda:           { description: '{N} maçta {V}+ KDA yap', xp: 50 },
};
```

### Inngest Cron

```typescript
// src/inngest/functions/challengeGenerator.ts
export const dailyChallengeGenerator = inngest.createFunction(
  { id: 'daily-challenge-generator' },
  { cron: '0 8 * * *' }, // her gün 08:00 UTC
  async ({ step }) => {
    // Aktif tüm kullanıcılara challenge üret
    const users = await step.run('fetch-active-users', () =>
      prisma.user.findMany({
        where: { lastLoginAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        include: { riotAccounts: { take: 1 } }
      })
    );
    // Fan-out: her kullanıcı için ayrı event
    await step.sendEvent('challenge/generate-for-users',
      users.map(u => ({ name: 'challenge/generate', data: { userId: u.id } }))
    );
  }
);
```

### Progress Tracking

Maç sync sonrası:
```typescript
// Aktif challenge'ları kontrol et
// Metriği güncelle
// Tamamlandıysa: completed = true, xp ekle, achievement tetikle
```

### Dashboard Widget

```
┌──────────────────────────────────────────┐
│  Bugünkü Görev ⚡                        │
├──────────────────────────────────────────┤
│  3 maçta 6.5+ CS/dk yap                 │
│  [████░░░░░░] 1/3 tamamlandı            │
│  Ödül: +50 XP                           │
│                                          │
│  Sona eriyor: 11 saat 32 dakika         │
│                                          │
│  Bu haftanın görevi:                     │
│  5 galibiyet serisine ulaş [0/5]        │
└──────────────────────────────────────────┘
```

### XP & Level Widget

```
┌──────────────────────┐
│  Seviye 7           │
│  [███████░░░] 420XP │
│  80 XP → Seviye 8   │
└──────────────────────┘
```

---

## Files

```
prisma/schema.prisma                                         ← Challenge, UserChallenge, User.xp/level
prisma/migrations/YYYYMMDD_add_challenges/                   ← YENİ
src/domains/analysis/services/challengeService.ts            ← YENİ
src/inngest/functions/challengeGenerator.ts                  ← YENİ cron
src/inngest/functions/challengeProgressChecker.ts            ← YENİ (sync sonrası)
src/inngest/index.ts                                         ← function kaydet
src/components/dashboard/DailyChallengeWidget.tsx            ← YENİ
src/components/dashboard/XpLevelWidget.tsx                   ← YENİ
app/api/challenges/route.ts                                  ← GET aktif challengelar
app/api/challenges/[id]/progress/route.ts                    ← GET ilerleme
src/hooks/useChallenges.ts                                   ← YENİ TanStack Query
src/domains/riot/services/matchSyncService.ts                ← challenge progress check
app/(app)/dashboard/page.tsx                                 ← widgetlar ekle
```

---

## Tier Gating

- **Free:** Günlük 1 challenge
- **Pro:** Günlük + haftalık challenge + XP geçmişi
- **Elite:** Özel challenge oluştur (AI ile)

---

## Test Plan

```typescript
describe('challengeService', () => {
  it('generateDailyChallenge: kullanıcının zayıf metriğine göre seçim yapılıyor')
  it('target: mevcut ortalamanın %10-15 üstünde')
  it('tamamlama: xp kullanıcıya ekleniyor')
  it('aynı gün iki kez generate → duplicate oluşmuyor')
  it('challenge süresi dolunca expired olarak işaretleniyor')
})
```

---

## Dependencies

- Inngest ✅
- `challengeService` → `habitDetectionService` verisini kullanır
- `achievementService` (TASK-078) → challenge tamamlama achievement'ı tetikler

---

## Definition of Done

- Her gün yeni challenge üretiliyor
- Progress maç sync ile güncelleniyor
- Dashboard widget çalışıyor
- XP sistemi işletiyor
- 7 günlük streak rozeti verilebiliyor
- Unit test coverage ≥ 80%
