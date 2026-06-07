# TASK-076 â€” Tilt Erken UyarÄ± & Recovery ProtokolÃ¼

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 1 day  
**Priority:** P0

---

## Objective

Mevcut `tiltService.ts` tilt skorunu hesaplÄ±yor ama sadece raporda gÃ¶steriyor.
Bu task: 3 Ã¼st Ã¼ste kayÄ±ptan sonra kullanÄ±cÄ±ya otomatik in-app bildirim ve
koÃ§luk mesajÄ± gÃ¶nder; tilt recovery protokolÃ¼ (mola Ã¶nerisi, motivasyon) tetikle.
Inngest event altyapÄ±sÄ± zaten mevcut â€” bunu kullanacaÄŸÄ±z.

---

## User Story

> "3 maÃ§Ä± Ã¼st Ã¼ste kaybettim ve fark etmeden 4. maÃ§a girdim. Birisi bana dur deseydi
> ve neden kaybettiÄŸimi sÃ¶yleseydi belki bu kadar LP kaybetmezdim."

---

## Acceptance Criteria

- [ ] MaÃ§ sync sonrasÄ± 3 Ã¼st Ã¼ste kayÄ±p tespit ediliyor
- [ ] Tespit anÄ±nda Inngest event tetikleniyor: `tilt/streak-detected`
- [ ] In-app bildirim sistemi: dashboard'da toast/banner gÃ¶steriliyor
- [ ] Recovery mesajÄ±: AI Ã¼retilmiÅŸ, kiÅŸiselleÅŸtirilmiÅŸ (son maÃ§larÄ±n verisi ile)
- [ ] "Mola Ã–nerisi" kartÄ±: 15 dakika dinlenme Ã¶nerisi + motivasyon
- [ ] KullanÄ±cÄ± "Tamam, anlÄ±yorum" diyebiliyor (bildirim kapatÄ±lÄ±yor, DB'ye yazÄ±lÄ±yor)
- [ ] GÃ¼nde maksimum 2 tilt uyarÄ±sÄ± (spam Ã¶nleme)
- [ ] Dashboard'da "Tilt Riski" widget'Ä±: mevcut tilt skoru + son 5 maÃ§ grafiÄŸi
- [ ] TypeScript strict â€” no `any`

---

## Technical Approach

### Inngest Event

```typescript
// MaÃ§ sync tamamlandÄ±ÄŸÄ±nda (matchSyncService.ts iÃ§inde):
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

    // Son 5 maÃ§Ä±n sonuÃ§larÄ±nÄ± Ã§ek
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

    // Spam kontrolÃ¼: son 12 saatte uyarÄ± gÃ¶nderildi mi?
    const recentAlert = await step.run('check-recent-alert', () =>
      prisma.tiltAlert.findFirst({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
        }
      })
    );
    if (recentAlert) return { skipped: 'cooldown' };

    // AI recovery mesajÄ± Ã¼ret
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

### Recovery MesajÄ± AI Prompt

```
Son 3 maÃ§: {champ} ile {result} ({kda}), {champ2} ile {result2}, {champ3} ile {result3}.
Ortalama Ã¶lÃ¼m: {avgDeaths}.
Oyuncuya TÃ¼rkÃ§e, 2 cÃ¼mlelik empatik ama aksiyonel bir mola mesajÄ± yaz.
"3 Ã¼st Ã¼ste kayÄ±p sonrasÄ± mola vermek WR'Ä±nÄ± %15 artÄ±rÄ±r" istatistiÄŸini dahil et.
```

### Frontend: Tilt Alert Banner

```typescript
// src/components/layout/TiltAlertBanner.tsx
// Dashboard layout'a ekle â€” aktif TiltAlert varsa gÃ¶ster
// "AnladÄ±m, devam edeceÄŸim" butonu â†’ POST /api/tilt/acknowledge
```

### API

```
GET  /api/tilt/alerts          â† aktif (unacknowledged) uyarÄ±lar
POST /api/tilt/acknowledge     â† { alertId } â†’ acknowledged = true
```

---

## Dashboard Widget: Tilt Riski

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Tilt Riski              [?]            â”‚
â”‚  â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘  Skor: 72/100              â”‚
â”‚                                         â”‚
â”‚  Son 5 maÃ§: âŒ âŒ âŒ âœ… âœ…             â”‚
â”‚  En riskli saat: 23:00 - 01:00         â”‚
â”‚                                         â”‚
â”‚  [KoÃ§ ile KonuÅŸ]                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Mevcut `tiltService.getTiltScore()` kullan.

---

## Files

```
prisma/schema.prisma                                    â† TiltAlert model
prisma/migrations/YYYYMMDD_add_tilt_alerts/             â† YENÄ°
src/inngest/functions/tiltStreakCheck.ts                â† YENÄ°
src/inngest/index.ts                                    â† function kaydet
src/domains/analysis/services/tiltService.ts            â† generateTiltRecoveryMessage ekle
src/components/layout/TiltAlertBanner.tsx               â† YENÄ°
src/components/dashboard/TiltRiskWidget.tsx             â† YENÄ°
app/api/tilt/alerts/route.ts                            â† YENÄ°
app/api/tilt/acknowledge/route.ts                       â† YENÄ°
src/domains/riot/services/matchSyncService.ts           â† event gÃ¶nder
app/(app)/dashboard/page.tsx                            â† widget + banner ekle
```

---

## Test Plan

```typescript
describe('tiltStreakCheck', () => {
  it('3 Ã¼st Ã¼ste kayÄ±p â†’ TiltAlert oluÅŸturulur')
  it('2 kayÄ±p 1 galibiyet â†’ uyarÄ± tetiklenmez')
  it('12 saat iÃ§inde ikinci uyarÄ± â†’ cooldown, gÃ¶nderilmez')
  it('acknowledge sonrasÄ± banner kaybolur')
})
```

---

## Dependencies

- `tiltService.ts` âœ…
- Inngest âœ…
- Upstash Redis âœ… (cooldown iÃ§in)

---

## Definition of Done

- 3 Ã¼st Ã¼ste kayÄ±p â†’ banner gÃ¶rÃ¼nÃ¼yor
- AI recovery mesajÄ± kiÅŸiselleÅŸtirilmiÅŸ
- GÃ¼nde 2 limit Ã§alÄ±ÅŸÄ±yor
- Dashboard tilt widget gÃ¶steriyor
- Unit test coverage â‰¥ 80%

