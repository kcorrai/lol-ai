# TASK-076 — Tilt Erken Uyarı & Recovery Protokolü

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 1 day  
**Priority:** P0

---

## Objective

Mevcut `tiltService.ts` tilt skorunu hesaplıyor ama sadece raporda gösteriyor.
Bu task: 3 üst üste kayıptan sonra kullanıcıya otomatik in-app bildirim ve
koçluk mesajı gönder; tilt recovery protokolü (mola önerisi, motivasyon) tetikle.
Inngest event altyapısı zaten mevcut — bunu kullanacağız.

---

## User Story

> "3 maçı üst üste kaybettim ve fark etmeden 4. maça girdim. Birisi bana dur deseydi
> ve neden kaybettiğimi söyleseydi belki bu kadar LP kaybetmezdim."

---

## Acceptance Criteria

- [ ] Maç sync sonrası 3 üst üste kayıp tespit ediliyor
- [ ] Tespit anında Inngest event tetikleniyor: `tilt/streak-detected`
- [ ] In-app bildirim sistemi: dashboard'da toast/banner gösteriliyor
- [ ] Recovery mesajı: AI üretilmiş, kişiselleştirilmiş (son maçların verisi ile)
- [ ] "Mola Önerisi" kartı: 15 dakika dinlenme önerisi + motivasyon
- [ ] Kullanıcı "Tamam, anlıyorum" diyebiliyor (bildirim kapatılıyor, DB'ye yazılıyor)
- [ ] Günde maksimum 2 tilt uyarısı (spam önleme)
- [ ] Dashboard'da "Tilt Riski" widget'ı: mevcut tilt skoru + son 5 maç grafiği
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Inngest Event

```typescript
// Maç sync tamamlandığında (matchSyncService.ts içinde):
await inngest.send({
  name: 'tilt/check-streak',
  data: { riotAccountId, userId, latestMatchId }
});
```

### Inngest Function

```typescript
// src/inngest/functions/tiltStreakCheck.ts
export const tiltStreakCheck = inngest.createFunction(
  { id: 'tilt-streak-check' },
  { event: 'tilt/check-streak' },
  async ({ event, step }) => {
    const { riotAccountId, userId } = event.data;

    // Son 5 maçın sonuçlarını çek
    const recentMatches = await step.run('fetch-recent', () =>
      prisma.matchParticipant.findMany({
        where: { riotAccountId },
        orderBy: { match: { gameEndTimestamp: 'desc' } },
        take: 5,
        include: { match: true }
      })
    );

    const lastThree = recentMatches.slice(0, 3);
    const isLoseStreak = lastThree.every(m => !m.win);
    if (!isLoseStreak) return { skipped: true };

    // Spam kontrolü: son 12 saatte uyarı gönderildi mi?
    const recentAlert = await step.run('check-recent-alert', () =>
      prisma.tiltAlert.findFirst({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
        }
      })
    );
    if (recentAlert) return { skipped: 'cooldown' };

    // AI recovery mesajı üret
    const message = await step.run('generate-message', () =>
      generateTiltRecoveryMessage(recentMatches)
    );

    // DB'ye kaydet
    await step.run('save-alert', () =>
      prisma.tiltAlert.create({
        data: { userId, riotAccountId, message, streakLength: 3 }
      })
    );

    return { sent: true, message };
  }
);
```

### DB Migration

```prisma
model TiltAlert {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @db.Uuid
  riotAccountId String   @db.Uuid
  message       String
  streakLength  Int
  acknowledged  Boolean  @default(false)
  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("tilt_alerts")
}
```

### Recovery Mesajı AI Prompt

```
Son 3 maç: {champ} ile {result} ({kda}), {champ2} ile {result2}, {champ3} ile {result3}.
Ortalama ölüm: {avgDeaths}.
Oyuncuya Türkçe, 2 cümlelik empatik ama aksiyonel bir mola mesajı yaz.
"3 üst üste kayıp sonrası mola vermek WR'ını %15 artırır" istatistiğini dahil et.
```

### Frontend: Tilt Alert Banner

```typescript
// src/components/layout/TiltAlertBanner.tsx
// Dashboard layout'a ekle — aktif TiltAlert varsa göster
// "Anladım, devam edeceğim" butonu → POST /api/tilt/acknowledge
```

### API

```
GET  /api/tilt/alerts          ← aktif (unacknowledged) uyarılar
POST /api/tilt/acknowledge     ← { alertId } → acknowledged = true
```

---

## Dashboard Widget: Tilt Riski

```
┌─────────────────────────────────────────┐
│  Tilt Riski              [?]            │
│  ████████░░  Skor: 72/100              │
│                                         │
│  Son 5 maç: ❌ ❌ ❌ ✅ ✅             │
│  En riskli saat: 23:00 - 01:00         │
│                                         │
│  [Koç ile Konuş]                        │
└─────────────────────────────────────────┘
```

Mevcut `tiltService.getTiltScore()` kullan.

---

## Files

```
prisma/schema.prisma                                    ← TiltAlert model
prisma/migrations/YYYYMMDD_add_tilt_alerts/             ← YENİ
src/inngest/functions/tiltStreakCheck.ts                ← YENİ
src/inngest/index.ts                                    ← function kaydet
src/domains/analysis/services/tiltService.ts            ← generateTiltRecoveryMessage ekle
src/components/layout/TiltAlertBanner.tsx               ← YENİ
src/components/dashboard/TiltRiskWidget.tsx             ← YENİ
app/api/tilt/alerts/route.ts                            ← YENİ
app/api/tilt/acknowledge/route.ts                       ← YENİ
src/domains/riot/services/matchSyncService.ts           ← event gönder
app/(app)/dashboard/page.tsx                            ← widget + banner ekle
```

---

## Test Plan

```typescript
describe('tiltStreakCheck', () => {
  it('3 üst üste kayıp → TiltAlert oluşturulur')
  it('2 kayıp 1 galibiyet → uyarı tetiklenmez')
  it('12 saat içinde ikinci uyarı → cooldown, gönderilmez')
  it('acknowledge sonrası banner kaybolur')
})
```

---

## Dependencies

- `tiltService.ts` ✅
- Inngest ✅
- Upstash Redis ✅ (cooldown için)

---

## Definition of Done

- 3 üst üste kayıp → banner görünüyor
- AI recovery mesajı kişiselleştirilmiş
- Günde 2 limit çalışıyor
- Dashboard tilt widget gösteriyor
- Unit test coverage ≥ 80%
