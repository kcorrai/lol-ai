# TASK-078 â€” Rozet & Achievement Sistemi

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 2 days  
**Priority:** P1

---

## Objective

OyuncularÄ±n belirli baÅŸarÄ±larÄ± tamamladÄ±ÄŸÄ±nda rozet kazandÄ±ÄŸÄ± bir gamification
sistemi kur. Rozetler profil sayfasÄ±nda gÃ¶sterilir, Discord'a paylaÅŸÄ±labilir ve
kullanÄ±cÄ±yÄ± platforma geri getiren gÃ¼Ã§lÃ¼ bir retention mekanizmasÄ± oluÅŸturur.

---

## User Story

> "Bu hafta 7.0+ CS/dk yaptÄ±m ama bunu takdir eden hiÃ§bir ÅŸey yok.
> Bir rozet veya Ã¶dÃ¼l olsaydÄ± daha motive olurdum."

---

## Acceptance Criteria

- [ ] `Achievement` ve `UserAchievement` DB tablolarÄ± mevcut
- [ ] 10+ rozet tanÄ±mlÄ± ve seed ile DB'ye yÃ¼klÃ¼
- [ ] MaÃ§ sync sonrasÄ± rozet kontrolÃ¼ otomatik tetikleniyor (Inngest)
- [ ] Yeni rozet kazanÄ±ldÄ±ÄŸÄ±nda in-app bildirim gÃ¶steriliyor
- [ ] `/achievements` sayfasÄ±: tÃ¼m rozetler, kazanÄ±lanlar vs. kilitliler
- [ ] Profil sayfasÄ±nda rozet vitrini (ilk 6 rozet)
- [ ] Rozet paylaÅŸÄ±m kartÄ± (`next/og` ile PNG Ã¼retimi)
- [ ] TypeScript strict â€” no `any`

---

## Rozet KataloÄŸu (Seed Data)

| ID | Ä°sim | AÃ§Ä±klama | Tetikleyici | Tier |
|---|---|---|---|---|
| `cs_machine` | CS Makinesi | 3 Ã¼st Ã¼ste 7.0+ CS/dk | matchParticipant.csPerMinute â‰¥ 7.0 Ã— 3 | GÃ¼mÃ¼ÅŸ |
| `deathless` | Dokunulmaz | 5 Ã¼st Ã¼ste â‰¤ 2 Ã¶lÃ¼m | matchParticipant.deaths â‰¤ 2 Ã— 5 | AltÄ±n |
| `rising_star` | YÃ¼kselen YÄ±ldÄ±z | Haftada +50 LP | rankHistory delta | AltÄ±n |
| `on_fire` | AteÅŸ Serisi | 5 maÃ§ galibiyet serisi | consecutive wins | GÃ¼mÃ¼ÅŸ |
| `habit_breaker` | AlÄ±ÅŸkanlÄ±k KÄ±rÄ±cÄ± | Tespit edilen bir alÄ±ÅŸkanlÄ±ÄŸÄ± Ã§Ã¶z | PlayerHabit.isResolved | Platin |
| `otp_apprentice` | OTP AdayÄ± | Tek ÅŸampiyonla 50 maÃ§ | championStats.games â‰¥ 50 | GÃ¼mÃ¼ÅŸ |
| `otp_master` | OTP UstasÄ± | Tek ÅŸampiyonla 100 maÃ§ | championStats.games â‰¥ 100 | Platin |
| `vision_ward` | Vizyon UstasÄ± | 3 Ã¼st Ã¼ste 10+ vision score | matchParticipant.visionScore â‰¥ 10 Ã— 3 | GÃ¼mÃ¼ÅŸ |
| `comeback_king` | Geri DÃ¶nÃ¼ÅŸ KralÄ± | Tilt sonrasÄ± 3 galibiyet serisi | tiltScore > 60 â†’ 3 win | AltÄ±n |
| `first_report` | Ä°lk Rapor | Ä°lk koÃ§luk raporunu al | coachingReport.count â‰¥ 1 | Bronz |
| `week_warrior` | Hafta SavaÅŸÃ§Ä±sÄ± | Haftada 20+ maÃ§ | matches count weekly | GÃ¼mÃ¼ÅŸ |
| `improvement_plan` | PlanlÄ± Oyuncu | Ä°lk improvement planÄ±nÄ± tamamla | improvementPlan completed | AltÄ±n |

---

## Technical Approach

### DB Schema

```prisma
model Achievement {
  id          String  @id
  name        String
  description String
  iconSlug    String  // '/achievements/cs_machine.svg'
  tier        String  // 'bronze' | 'silver' | 'gold' | 'platinum'
  isSecret    Boolean @default(false)

  userAchievements UserAchievement[]

  @@map("achievements")
}

model UserAchievement {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @db.Uuid
  achievementId String
  earnedAt      DateTime @default(now())
  seen          Boolean  @default(false)  // bildirim gÃ¶sterildi mi?

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement Achievement @relation(fields: [achievementId], references: [id])

  @@unique([userId, achievementId])
  @@index([userId, seen])
  @@map("user_achievements")
}
```

### Achievement Checker Servisi

```typescript
// src/domains/analysis/services/achievementService.ts

export async function checkAndAwardAchievements(
  userId: string,
  riotAccountId: string
): Promise<string[]> // kazanÄ±lan achievement ID'leri
```

Her checker ayrÄ± pure fonksiyon:
```typescript
async function checkCsMachine(riotAccountId: string): Promise<boolean>
async function checkDeathless(riotAccountId: string): Promise<boolean>
async function checkRisingStar(riotAccountId: string): Promise<boolean>
// ...
```

### Inngest Tetikleme

```typescript
// matchSyncService.ts sync sonrasÄ±:
await inngest.send({
  name: 'achievement/check',
  data: { userId, riotAccountId }
});
```

### Bildirim

```typescript
// src/components/layout/AchievementToast.tsx
// Yeni rozet kazanÄ±ldÄ±ktan sonra sayfa yenilenince gÃ¶rÃ¼nÃ¼r
// Animasyonlu: rozet ikonu + isim + "PaylaÅŸ" butonu
```

### API

```
GET /api/achievements          â† kullanÄ±cÄ±nÄ±n tÃ¼m rozetleri (earned + locked)
POST /api/achievements/seen    â† { achievementId } â†’ seen = true
GET /api/achievements/share/[achievementId] â† PNG OG image (next/og)
```

### Rozet SayfasÄ±

```
app/(app)/achievements/page.tsx

Layout:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Rozetlerin   12/24 kazanÄ±ldÄ±   [PaylaÅŸ]   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [ğŸ† CS Makinesi] [ğŸ›¡ï¸ Dokunulmaz] [âš¡ ...]  â”‚  â† kazanÄ±lanlar
â”‚  [ğŸ”’ Kilitli]    [ğŸ”’ Kilitli]    [ğŸ”’ ...]   â”‚  â† kilitlenenler (blur)
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### OG Image (PaylaÅŸÄ±m KartÄ±)

```typescript
// app/api/achievements/share/[achievementId]/route.ts
// next/og ile 800x420 PNG
// Rozet adÄ±, tier rengi, kullanÄ±cÄ± adÄ±, platform adÄ±
```

---

## Files

```
prisma/schema.prisma                                      â† Achievement, UserAchievement
prisma/migrations/YYYYMMDD_add_achievements/              â† YENÄ°
prisma/seed/achievements.ts                               â† rozet kataloÄŸu seed
src/domains/analysis/services/achievementService.ts       â† YENÄ°
src/inngest/functions/achievementChecker.ts               â† YENÄ°
src/inngest/index.ts                                      â† function kaydet
app/(app)/achievements/page.tsx                           â† YENÄ° sayfa
src/components/layout/AchievementToast.tsx                â† YENÄ°
app/api/achievements/route.ts                             â† GET
app/api/achievements/seen/route.ts                        â† POST
app/api/achievements/share/[achievementId]/route.ts       â† OG image
src/hooks/useAchievements.ts                              â† YENÄ° TanStack Query
src/domains/riot/services/matchSyncService.ts             â† event ekle
```

---

## Tier Gating

- **Free:** Bronz + GÃ¼mÃ¼ÅŸ rozetler gÃ¶rÃ¼nÃ¼r
- **Pro:** TÃ¼m rozetler + paylaÅŸÄ±m kartÄ±
- **Elite:** Secret rozetler

---

## Test Plan

```typescript
describe('achievementService', () => {
  it('checkCsMachine: 3 Ã¼st Ã¼ste 7.0+ â†’ true')
  it('checkCsMachine: sadece 2 Ã¼st Ã¼ste â†’ false')
  it('checkDeathless: araya girmiÅŸ yÃ¼ksek Ã¶lÃ¼m â†’ false')
  it('duplicate award: aynÄ± rozet iki kez verilmez')
  it('checkAndAwardAchievements: birden fazla rozet aynÄ± anda verilebilir')
})
```

---

## Dependencies

- Inngest âœ…
- matchSyncService.ts âœ…
- `next/og` âœ…

---

## Definition of Done

- 12 rozet seed ile DB'de
- MaÃ§ sync sonrasÄ± otomatik kontrol Ã§alÄ±ÅŸÄ±yor
- Yeni rozet â†’ toast bildirimi gÃ¶rÃ¼nÃ¼yor
- `/achievements` sayfasÄ± Ã§alÄ±ÅŸÄ±yor
- PaylaÅŸÄ±m kartÄ± PNG dÃ¶ndÃ¼rÃ¼yor
- Unit test coverage â‰¥ 80%
- `docs/DATABASE_SCHEMA.md` gÃ¼ncellendi

