# TASK-078 — Rozet & Achievement Sistemi

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 2 days  
**Priority:** P1

---

## Objective

Oyuncuların belirli başarıları tamamladığında rozet kazandığı bir gamification
sistemi kur. Rozetler profil sayfasında gösterilir, Discord'a paylaşılabilir ve
kullanıcıyı platforma geri getiren güçlü bir retention mekanizması oluşturur.

---

## User Story

> "Bu hafta 7.0+ CS/dk yaptım ama bunu takdir eden hiçbir şey yok.
> Bir rozet veya ödül olsaydı daha motive olurdum."

---

## Acceptance Criteria

- [ ] `Achievement` ve `UserAchievement` DB tabloları mevcut
- [ ] 10+ rozet tanımlı ve seed ile DB'ye yüklü
- [ ] Maç sync sonrası rozet kontrolü otomatik tetikleniyor (Inngest)
- [ ] Yeni rozet kazanıldığında in-app bildirim gösteriliyor
- [ ] `/achievements` sayfası: tüm rozetler, kazanılanlar vs. kilitliler
- [ ] Profil sayfasında rozet vitrini (ilk 6 rozet)
- [ ] Rozet paylaşım kartı (`next/og` ile PNG üretimi)
- [ ] TypeScript strict — no `any`

---

## Rozet Kataloğu (Seed Data)

| ID | İsim | Açıklama | Tetikleyici | Tier |
|---|---|---|---|---|
| `cs_machine` | CS Makinesi | 3 üst üste 7.0+ CS/dk | matchParticipant.csPerMinute ≥ 7.0 × 3 | Gümüş |
| `deathless` | Dokunulmaz | 5 üst üste ≤ 2 ölüm | matchParticipant.deaths ≤ 2 × 5 | Altın |
| `rising_star` | Yükselen Yıldız | Haftada +50 LP | rankHistory delta | Altın |
| `on_fire` | Ateş Serisi | 5 maç galibiyet serisi | consecutive wins | Gümüş |
| `habit_breaker` | Alışkanlık Kırıcı | Tespit edilen bir alışkanlığı çöz | PlayerHabit.isResolved | Platin |
| `otp_apprentice` | OTP Adayı | Tek şampiyonla 50 maç | championStats.games ≥ 50 | Gümüş |
| `otp_master` | OTP Ustası | Tek şampiyonla 100 maç | championStats.games ≥ 100 | Platin |
| `vision_ward` | Vizyon Ustası | 3 üst üste 10+ vision score | matchParticipant.visionScore ≥ 10 × 3 | Gümüş |
| `comeback_king` | Geri Dönüş Kralı | Tilt sonrası 3 galibiyet serisi | tiltScore > 60 → 3 win | Altın |
| `first_report` | İlk Rapor | İlk koçluk raporunu al | coachingReport.count ≥ 1 | Bronz |
| `week_warrior` | Hafta Savaşçısı | Haftada 20+ maç | matches count weekly | Gümüş |
| `improvement_plan` | Planlı Oyuncu | İlk improvement planını tamamla | improvementPlan completed | Altın |

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
  seen          Boolean  @default(false)  // bildirim gösterildi mi?

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
): Promise<string[]> // kazanılan achievement ID'leri
```

Her checker ayrı pure fonksiyon:
```typescript
async function checkCsMachine(riotAccountId: string): Promise<boolean>
async function checkDeathless(riotAccountId: string): Promise<boolean>
async function checkRisingStar(riotAccountId: string): Promise<boolean>
// ...
```

### Inngest Tetikleme

```typescript
// matchSyncService.ts sync sonrası:
await inngest.send({
  name: 'achievement/check',
  data: { userId, riotAccountId }
});
```

### Bildirim

```typescript
// src/components/layout/AchievementToast.tsx
// Yeni rozet kazanıldıktan sonra sayfa yenilenince görünür
// Animasyonlu: rozet ikonu + isim + "Paylaş" butonu
```

### API

```
GET /api/achievements          ← kullanıcının tüm rozetleri (earned + locked)
POST /api/achievements/seen    ← { achievementId } → seen = true
GET /api/achievements/share/[achievementId] ← PNG OG image (next/og)
```

### Rozet Sayfası

```
app/(app)/achievements/page.tsx

Layout:
┌─────────────────────────────────────────────┐
│  Rozetlerin   12/24 kazanıldı   [Paylaş]   │
├─────────────────────────────────────────────┤
│  [🏆 CS Makinesi] [🛡️ Dokunulmaz] [⚡ ...]  │  ← kazanılanlar
│  [🔒 Kilitli]    [🔒 Kilitli]    [🔒 ...]   │  ← kilitlenenler (blur)
└─────────────────────────────────────────────┘
```

### OG Image (Paylaşım Kartı)

```typescript
// app/api/achievements/share/[achievementId]/route.ts
// next/og ile 800x420 PNG
// Rozet adı, tier rengi, kullanıcı adı, platform adı
```

---

## Files

```
prisma/schema.prisma                                      ← Achievement, UserAchievement
prisma/migrations/YYYYMMDD_add_achievements/              ← YENİ
prisma/seed/achievements.ts                               ← rozet kataloğu seed
src/domains/analysis/services/achievementService.ts       ← YENİ
src/inngest/functions/achievementChecker.ts               ← YENİ
src/inngest/index.ts                                      ← function kaydet
app/(app)/achievements/page.tsx                           ← YENİ sayfa
src/components/layout/AchievementToast.tsx                ← YENİ
app/api/achievements/route.ts                             ← GET
app/api/achievements/seen/route.ts                        ← POST
app/api/achievements/share/[achievementId]/route.ts       ← OG image
src/hooks/useAchievements.ts                              ← YENİ TanStack Query
src/domains/riot/services/matchSyncService.ts             ← event ekle
```

---

## Tier Gating

- **Free:** Bronz + Gümüş rozetler görünür
- **Pro:** Tüm rozetler + paylaşım kartı
- **Elite:** Secret rozetler

---

## Test Plan

```typescript
describe('achievementService', () => {
  it('checkCsMachine: 3 üst üste 7.0+ → true')
  it('checkCsMachine: sadece 2 üst üste → false')
  it('checkDeathless: araya girmiş yüksek ölüm → false')
  it('duplicate award: aynı rozet iki kez verilmez')
  it('checkAndAwardAchievements: birden fazla rozet aynı anda verilebilir')
})
```

---

## Dependencies

- Inngest ✅
- matchSyncService.ts ✅
- `next/og` ✅

---

## Definition of Done

- 12 rozet seed ile DB'de
- Maç sync sonrası otomatik kontrol çalışıyor
- Yeni rozet → toast bildirimi görünüyor
- `/achievements` sayfası çalışıyor
- Paylaşım kartı PNG döndürüyor
- Unit test coverage ≥ 80%
- `docs/DATABASE_SCHEMA.md` güncellendi
